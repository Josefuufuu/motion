import json
import secrets

from django import forms
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect, render
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods, require_GET
from django.contrib.auth.models import User
from django.views.decorators.csrf import ensure_csrf_cookie
from django.middleware.csrf import get_token
import logging
from datetime import timedelta

from django.utils import timezone
from django.db.models import Avg, Count, ExpressionWrapper, F, FloatField
from rest_framework import viewsets, filters, permissions
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.reverse import reverse
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from .models import Activity, UserProfile, Tournament, ActivityEnrollment
from .serializers import ActivitySerializer, TournamentSerializer, ActivityEnrollmentSerializer

# Set up logging
logger = logging.getLogger(__name__)

CHECKIN_TOKEN_TTL_MINUTES = 10

def index(request):
    return HttpResponse("Bienvenidos al Centro Artístico y Deportivo")

def login_view(request):
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            # Autenticar usuario
            user = form.get_user()
            login(request, user)
            return redirect('index')  # Redirigir a la página principal o dashboard
    else:
        form = AuthenticationForm()

    return render(request, 'login.html', {'form': form})

def register_view(request):
    if request.method == 'POST':
        form = UserProfileRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            username = form.cleaned_data.get("username")
            password = form.cleaned_data.get("password1")
            authenticated_user = None
            if username and password:
                authenticated_user = authenticate(
                    request, username=username, password=password
                )

            if authenticated_user is not None:
                login(request, authenticated_user)
            else:
                login(
                    request,
                    user,
                    backend="django.contrib.auth.backends.ModelBackend",
                )
            return redirect('/')  # Redirigir a la página principal
    else:
        form = UserProfileRegistrationForm()

    return render(request, 'register.html', {'form': form})

def logout_view(request):
    logout(request)
    return redirect('/')


def _serialize_user(user):
    """Return a JSON-serializable representation of a user with profile and role info."""
    # Guarantee a profile exists
    profile, _ = UserProfile.objects.get_or_create(user=user)

    created_iso = profile.created_at.isoformat() if profile.created_at else None
    updated_iso = profile.updated_at.isoformat() if profile.updated_at else None

    profile_data = {
        "role": profile.role,
        "is_admin": profile.is_admin,
        "is_beneficiary": profile.is_beneficiary,
        "phone_number": profile.phone_number,
        "program": profile.program,
        "semester": profile.semester,
        "created_at": created_iso,
        "updated_at": updated_iso,
    }

    return {
        "id": user.id,
        "username": user.get_username(),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "profile": profile_data,
    }


def _load_body(request):
    try:
        if not request.body:
            return {}
        return json.loads(request.body.decode("utf-8"))
    except (TypeError, ValueError, json.JSONDecodeError):
        return None


def _resolve_username(identifier):
    if not identifier:
        return None

    if "@" not in identifier:
        return identifier

    UserModel = get_user_model()
    try:
        user = UserModel.objects.get(email__iexact=identifier)
    except UserModel.DoesNotExist:
        return None

    return user.get_username()


def _percentage_change(current, previous):
    """Return the percentage change between two values or None when undefined."""
    if previous in (None, 0):
        return None
    try:
        return ((current - previous) / previous) * 100.0
    except (TypeError, ZeroDivisionError):
        return None


def _average_occupancy(queryset):
    """Calculate the average occupancy (0-1) for the given queryset of activities."""
    if queryset is None:
        return None

    result = queryset.aggregate(
        occupancy=Avg(
            ExpressionWrapper(
                F("actual_attendees") * 1.0 / F("capacity"),
                output_field=FloatField(),
            )
        )
    )
    return result.get("occupancy")


class UserProfileRegistrationForm(UserCreationForm):
    email = forms.EmailField(required=True)
    phone_number = forms.CharField(required=True, max_length=20)
    program = forms.CharField(required=True, max_length=120)
    semester = forms.IntegerField(required=True)
    role = forms.ChoiceField(
        required=True,
        choices=[
            (value, label)
            for value, label in UserProfile.ROLE_CHOICES
            if value in {"BENEFICIARY", "PROFESSOR"}
        ],
    )

    class Meta(UserCreationForm.Meta):
        fields = (
            *UserCreationForm.Meta.fields,
            "email",
            "phone_number",
            "program",
            "semester",
            "role",
        )

    field_order = (
        "username",
        "email",
        "phone_number",
        "program",
        "semester",
        "role",
        "password1",
        "password2",
    )

    def clean_phone_number(self):
        phone = self.cleaned_data.get("phone_number", "")
        digits = "".join(char for char in phone if char.isdigit())

        if len(digits) != 10:
            raise forms.ValidationError("El número de celular debe tener 10 dígitos.")

        return digits

    def clean_semester(self):
        semester = self.cleaned_data.get("semester")
        if semester is None:
            raise forms.ValidationError("Debes ingresar el semestre.")

        try:
            semester = int(semester)
        except (TypeError, ValueError):
            raise forms.ValidationError("Debes ingresar un número de semestre válido.")

        if not 1 <= semester <= 20:
            raise forms.ValidationError("El semestre debe estar entre 1 y 20.")

        return semester

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data["email"]

        if commit:
            user.save()
            UserProfile.objects.update_or_create(
                user=user,
                defaults={
                    "phone_number": self.cleaned_data["phone_number"],
                    "program": self.cleaned_data["program"],
                    "semester": self.cleaned_data["semester"],
                    "role": self.cleaned_data["role"],
                },
            )

        return user


@ensure_csrf_cookie
@csrf_exempt
def api_login(request):
    if request.method != "POST":
        return JsonResponse({"ok": False, "error": "Method not allowed"}, status=405)

    payload = _load_body(request)
    if payload is None:
        return JsonResponse({"ok": False, "error": "Invalid JSON"}, status=400)

    identifier = payload.get("username") or payload.get("email")
    password = payload.get("password")

    if not identifier or not password:
        return JsonResponse({"ok": False, "error": "Missing credentials"}, status=400)

    username = _resolve_username(identifier)
    if username is None:
        username = identifier

    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse({"ok": False, "error": "Invalid credentials"}, status=401)

    login(request, user)
    get_token(request)
    return JsonResponse({"ok": True, "user": _serialize_user(user)}, status=200)


@csrf_exempt
def api_logout(request):
    if request.method != "POST":
        return JsonResponse({"ok": False, "error": "Method not allowed"}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({"ok": False, "error": "Not authenticated"}, status=401)

    logout(request)
    return JsonResponse({"ok": True}, status=200)


@ensure_csrf_cookie
@csrf_exempt
def api_register(request):
    """Create a user account from a JSON payload.

    Expected payload:
    {
        "username": "<str>",
        "email": "<str>",
        "password1": "<str>",
        "password2": "<str>",
        "phone_number": "<10-digit str>",
        "program": "<str>",
        "semester": <int between 1 and 20>,
        "role": "BENEFICIARY" | "PROFESSOR"
    }
    """

    if request.method != "POST":
        return JsonResponse({"ok": False, "error": "Method not allowed"}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({"ok": False, "error": "Not authenticated"}, status=401)

    user_profile = getattr(request.user, "profile", None)
    has_admin_perms = any(
        [
            request.user.is_staff,
            request.user.is_superuser,
            getattr(user_profile, "is_admin", False),
        ]
    )

    if not has_admin_perms:
        return JsonResponse({"ok": False, "error": "Forbidden"}, status=403)

    payload = _load_body(request)
    if payload is None:
        return JsonResponse({"ok": False, "error": "Invalid JSON"}, status=400)

    form = UserProfileRegistrationForm(payload)
    if not form.is_valid():
        errors = {field: [str(error) for error in error_list] for field, error_list in form.errors.items()}
        return JsonResponse({"ok": False, "errors": errors}, status=400)

    user = form.save()
    user_data = _serialize_user(user)

    get_token(request)
    return JsonResponse(
        {
            "ok": True,
            "message": "Usuario creado correctamente.",
            "user": user_data,
        },
        status=201,
    )


@csrf_exempt
def api_user_activities(request):
    """Return activities visible to the current user.
    For now, return all activities; you can filter by enrollment/visibility later.
    """
    if request.method != "GET":
        return JsonResponse({"ok": False, "error": "Method not allowed"}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({"ok": False}, status=401)

    qs = Activity.objects.all().order_by("-start")
    data = ActivitySerializer(qs, many=True, context={"request": request}).data
    return JsonResponse(data, safe=False, status=200)


@ensure_csrf_cookie
def api_session(request):
    if request.method != "GET":
        return JsonResponse({"ok": False, "error": "Method not allowed"}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({"ok": False}, status=401)

    # Ensure CSRF token is issued
    get_token(request)
    return JsonResponse({"ok": True, "user": _serialize_user(request.user)}, status=200)


# Custom permission class for activities
class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow:
    - Read-only access to all authenticated users
    - Write access only to admin users (staff, superuser, or ADMIN role)
    - Professors can update activities assigned to them (limited fields)
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        # Admin full access
        if request.user.is_staff or request.user.is_superuser:
            return True
        profile = getattr(request.user, 'profile', None)
        if profile and profile.is_admin:
            return True
        # Professors allowed partial update via custom action (handled in has_object_permission)
        if profile and profile.is_professor and view.action in ['partial_update', 'professor_update']:
            return True
        return False

    def has_object_permission(self, request, view, obj):
        # Read permissions allowed already
        if request.method in permissions.SAFE_METHODS:
            return True
        # Admin full access
        if request.user.is_staff or request.user.is_superuser:
            return True
        profile = getattr(request.user, 'profile', None)
        if profile and profile.is_admin:
            return True
        # Professor can modify only if assigned to them and only via partial update
        if profile and profile.is_professor and obj.assigned_professor_id == request.user.id and view.action in ['partial_update', 'professor_update']:
            return True
        return False


# Activity ViewSet
class ActivityViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Activities CRUD operations
    Only admins can create, update, or delete activities.
    All authenticated users can view activities.
    """
    queryset = Activity.objects.all().order_by('-start')
    serializer_class = ActivitySerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category', 'status', 'visibility', 'assigned_professor']
    search_fields = ['title', 'description', 'location', 'instructor']

    def get_queryset(self):
        queryset = Activity.objects.all().order_by('-start')
        request = self.request

        # Optional filters
        from_date = request.query_params.get('from')
        to_date = request.query_params.get('to')
        category = request.query_params.get('category')
        q = request.query_params.get('q')
        assigned_professor = request.query_params.get('assigned_professor')
        only_mine_prof = request.query_params.get('mine_prof') == '1'

        if from_date:
            queryset = queryset.filter(start__gte=from_date)
        if to_date:
            queryset = queryset.filter(start__lte=to_date)
        if category:
            queryset = queryset.filter(category=category)
        if q:
            queryset = queryset.filter(
                Q(title__icontains=q) |
                Q(description__icontains=q) |
                Q(location__icontains=q) |
                Q(instructor__icontains=q)
            )
        if assigned_professor:
            queryset = queryset.filter(assigned_professor_id=assigned_professor)

        # Professors requesting their own activities
        user = request.user if request.user.is_authenticated else None
        prof_profile = getattr(user, 'profile', None)
        if user and prof_profile and prof_profile.is_professor and only_mine_prof:
            queryset = queryset.filter(assigned_professor=user)

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['patch'], url_path='professor-update')
    def professor_update(self, request, pk=None):
        activity = self.get_object()
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.is_professor:
            return Response({'detail': 'No autorizado'}, status=403)
        if activity.assigned_professor_id != request.user.id:
            return Response({'detail': 'Solo el profesor asignado puede modificar esta actividad'}, status=403)

        # Limitar campos que puede cambiar el profesor
        allowed_fields = {'description', 'location', 'start', 'end', 'status'}
        partial_data = {k: v for k, v in request.data.items() if k in allowed_fields}
        serializer = self.get_serializer(activity, data=partial_data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='professor/list')
    def list_for_professor(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.is_professor:
            return Response({'detail': 'No autorizado'}, status=403)
        qs = self.get_queryset().filter(assigned_professor=request.user)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='enrollments')
    def list_enrollments(self, request, pk=None):
        activity = self.get_object()
        # Admins or assigned professor can see enrollments; authenticated users see nothing sensitive
        user = request.user
        profile = getattr(user, 'profile', None)
        if not user.is_staff and not user.is_superuser and not (profile and (profile.is_admin or (profile.is_professor and activity.assigned_professor_id == user.id))):
            return Response({'detail': 'No autorizado'}, status=403)
        qs = activity.enrollments.select_related('user', 'user__profile').order_by('-enrolled_at')
        data = ActivityEnrollmentSerializer(qs, many=True).data
        return Response(data)

    @action(
        detail=True,
        methods=['post'],
        url_path='generate-checkin',
        permission_classes=[permissions.IsAuthenticated],
    )
    def generate_checkin(self, request, pk=None):
        activity = self.get_object()
        user = request.user
        profile = getattr(user, 'profile', None)
        if not profile or not profile.is_professor or activity.assigned_professor_id != user.id:
            return Response({'detail': 'Solo el profesor asignado puede generar el check-in'}, status=403)

        token = secrets.token_urlsafe(20)
        expires_at = timezone.now() + timedelta(minutes=CHECKIN_TOKEN_TTL_MINUTES)
        activity.checkin_token = token
        activity.checkin_expires_at = expires_at
        activity.save(update_fields=['checkin_token', 'checkin_expires_at'])

        checkin_base_url = request.build_absolute_uri(
            reverse('activity-checkin')
        )
        checkin_url = f"{checkin_base_url}?token={token}"
        return Response(
            {
                'token': token,
                'expires_at': expires_at,
                'checkin_url': checkin_url,
            }
        )

    @action(
        detail=False,
        methods=['post'],
        url_path='checkin',
        permission_classes=[permissions.IsAuthenticated],
    )
    def checkin(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'detail': 'Token requerido'}, status=400)

        try:
            activity = Activity.objects.get(checkin_token=token)
        except Activity.DoesNotExist:
            return Response({'detail': 'Token inválido'}, status=404)

        if not activity.checkin_expires_at or activity.checkin_expires_at < timezone.now():
            return Response({'detail': 'Token expirado'}, status=400)

        enrollment, _ = ActivityEnrollment.objects.get_or_create(
            user=request.user,
            activity=activity,
        )

        attended_before = enrollment.attended
        if not enrollment.attended:
            enrollment.attended = True
            enrollment.save(update_fields=['attended'])

        updates = []
        if not attended_before:
            activity.actual_attendees = activity.enrollments.filter(attended=True).count()
            updates.append('actual_attendees')
            if activity.capacity:
                activity.available_spots = max(activity.capacity - activity.actual_attendees, 0)
                updates.append('available_spots')
            if updates:
                activity.save(update_fields=updates)
        else:
            activity.refresh_from_db(fields=['actual_attendees', 'available_spots'])

        return Response(
            {
                'detail': 'Check-in registrado',
                'activity_id': activity.id,
                'attended': True,
                'already_marked': attended_before,
                'actual_attendees': activity.actual_attendees,
                'available_spots': activity.available_spots,
            }
        )

    @action(detail=True, methods=['post'], url_path='enroll')
    def enroll(self, request, pk=None):
        activity = self.get_object()
        if not request.user.is_authenticated:
            return Response({'detail': 'Auth required'}, status=401)
        if activity.available_spots <= 0:
            return Response({'detail': 'No hay cupos disponibles'}, status=400)
        obj, created = ActivityEnrollment.objects.get_or_create(user=request.user, activity=activity)
        if not created:
            return Response({'detail': 'Ya estás inscrito'}, status=200)
        # Decrement available spots
        if activity.available_spots > 0:
            activity.available_spots -= 1
            activity.save(update_fields=['available_spots'])
        return Response(ActivityEnrollmentSerializer(obj).data, status=201)

    @action(detail=True, methods=['post'], url_path='unenroll')
    def unenroll(self, request, pk=None):
        activity = self.get_object()
        if not request.user.is_authenticated:
            return Response({'detail': 'Auth required'}, status=401)
        try:
            enr = ActivityEnrollment.objects.get(user=request.user, activity=activity)
        except ActivityEnrollment.DoesNotExist:
            return Response({'detail': 'No estás inscrito'}, status=400)
        enr.delete()
        # Return spot
        activity.available_spots += 1
        activity.save(update_fields=['available_spots'])
        return Response({'ok': True})

    @action(detail=True, methods=['patch'], url_path='professor/attendance')
    def professor_attendance(self, request, pk=None):
        activity = self.get_object()
        user = request.user
        profile = getattr(user, 'profile', None)
        if not (profile and profile.is_professor and activity.assigned_professor_id == user.id):
            return Response({'detail': 'No autorizado'}, status=403)
        # Expect body: { "attended": [user_id, ...], "not_attended": [user_id, ...] }
        attended_ids = request.data.get('attended', []) or []
        not_attended_ids = request.data.get('not_attended', []) or []
        # Update attended flags
        qs = ActivityEnrollment.objects.filter(activity=activity, user_id__in=(attended_ids + not_attended_ids))
        marked_attended = 0
        for enr in qs:
            flag = enr.user_id in attended_ids
            if enr.attended != flag:
                enr.attended = flag
                enr.save(update_fields=['attended'])
            if flag:
                marked_attended += 1
        # Auto update actual_attendees
        activity.actual_attendees = ActivityEnrollment.objects.filter(activity=activity, attended=True).count()
        activity.save(update_fields=['actual_attendees'])
        return Response({'ok': True, 'actual_attendees': activity.actual_attendees, 'marked_attended': marked_attended})

    @action(detail=True, methods=['patch'], url_path='professor/notes')
    def professor_notes(self, request, pk=None):
        activity = self.get_object()
        user = request.user
        profile = getattr(user, 'profile', None)
        if not (profile and profile.is_professor and activity.assigned_professor_id == user.id):
            return Response({'detail': 'No autorizado'}, status=403)
        notes = request.data.get('notes', '')
        activity.notes = notes
        activity.save(update_fields=['notes'])
        return Response({'ok': True, 'notes': activity.notes})


# Tournament ViewSet
class TournamentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Tournament CRUD operations
    Only admins can create, update, or delete tournaments.
    All authenticated users can view tournaments.
    """
    queryset = Tournament.objects.all().order_by('-start')
    serializer_class = TournamentSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['sport', 'status', 'visibility']
    search_fields = ['name', 'description', 'location']

    def perform_create(self, serializer):
        """
        Set the created_by field to the current user when creating a tournament
        """
        serializer.save(created_by=self.request.user)


@require_GET
@login_required
def api_professors(request):
    qs = User.objects.filter(profile__role='PROFESSOR').order_by('first_name', 'last_name', 'username')
    data = [
        {
            'id': u.id,
            'username': u.username,
            'first_name': u.first_name,
            'last_name': u.last_name,
            'full_name': (u.get_full_name() or u.username),
            'email': u.email,
        }
        for u in qs
    ]
    return JsonResponse(data, safe=False, status=200)


@api_view(["GET"])
def api_reports_dashboard(request):
    user = request.user
    if not user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=401)

    profile = getattr(user, "profile", None)
    has_admin_perms = any(
        [
            user.is_staff,
            user.is_superuser,
            bool(profile and getattr(profile, "is_admin", False)),
        ]
    )
    if not has_admin_perms:
        return Response({"detail": "No autorizado"}, status=403)

    now = timezone.now()
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day + timedelta(days=1)

    todays_attendance = ActivityEnrollment.objects.filter(
        attended=True,
        activity__start__gte=start_of_day,
        activity__start__lt=end_of_day,
    ).count()
    yesterdays_attendance = ActivityEnrollment.objects.filter(
        attended=True,
        activity__start__gte=start_of_day - timedelta(days=1),
        activity__start__lt=start_of_day,
    ).count()

    open_enrollments = Activity.objects.filter(
        status="active",
        start__gte=now,
        available_spots__gt=0,
    ).count()
    open_enrollments_previous = Activity.objects.filter(
        status="active",
        start__gte=now - timedelta(days=14),
        start__lt=now - timedelta(days=7),
        available_spots__gt=0,
    ).count()

    week_start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    week_end = week_start + timedelta(days=7)
    previous_week_start = week_start - timedelta(days=7)

    occupancy_current = _average_occupancy(
        Activity.objects.filter(
            start__gte=week_start,
            start__lt=week_end,
            capacity__gt=0,
        )
    )
    occupancy_previous = _average_occupancy(
        Activity.objects.filter(
            start__gte=previous_week_start,
            start__lt=week_start,
            capacity__gt=0,
        )
    )

    incidents_current = Activity.objects.filter(
        status="cancelled",
        updated_at__gte=now - timedelta(days=7),
    ).count()
    incidents_previous = Activity.objects.filter(
        status="cancelled",
        updated_at__gte=now - timedelta(days=14),
        updated_at__lt=now - timedelta(days=7),
    ).count()

    weekly_attendance_current = ActivityEnrollment.objects.filter(
        attended=True,
        activity__start__gte=week_start,
        activity__start__lt=week_end,
    ).count()
    weekly_attendance_previous = ActivityEnrollment.objects.filter(
        attended=True,
        activity__start__gte=previous_week_start,
        activity__start__lt=week_start,
    ).count()

    weekly_new_users_current = User.objects.filter(
        date_joined__gte=week_start,
        date_joined__lt=week_end,
    ).count()
    weekly_new_users_previous = User.objects.filter(
        date_joined__gte=previous_week_start,
        date_joined__lt=week_start,
    ).count()

    weekly_activities_created_current = Activity.objects.filter(
        created_at__gte=week_start,
        created_at__lt=week_end,
    ).count()
    weekly_activities_created_previous = Activity.objects.filter(
        created_at__gte=previous_week_start,
        created_at__lt=week_start,
    ).count()

    summary_cards = [
        {
            "key": "attendance_today",
            "label": "Asistencia hoy",
            "value": todays_attendance,
            "change": _percentage_change(todays_attendance, yesterdays_attendance),
            "format": "number",
        },
        {
            "key": "open_enrollments",
            "label": "Inscripciones abiertas",
            "value": open_enrollments,
            "change": _percentage_change(open_enrollments, open_enrollments_previous),
            "format": "number",
        },
        {
            "key": "occupancy_rate",
            "label": "Ocupación promedio",
            "value": (occupancy_current * 100) if occupancy_current is not None else None,
            "change": _percentage_change(occupancy_current or 0, occupancy_previous or 0),
            "format": "percentage",
        },
        {
            "key": "weekly_incidents",
            "label": "Incidencias (7 días)",
            "value": incidents_current,
            "change": _percentage_change(incidents_current, incidents_previous),
            "format": "number",
        },
    ]

    weekly_metrics = [
        {
            "key": "weekly_attendance",
            "label": "Asistencias registradas",
            "current": weekly_attendance_current,
            "previous": weekly_attendance_previous,
            "change": _percentage_change(weekly_attendance_current, weekly_attendance_previous),
        },
        {
            "key": "weekly_new_users",
            "label": "Nuevos usuarios",
            "current": weekly_new_users_current,
            "previous": weekly_new_users_previous,
            "change": _percentage_change(weekly_new_users_current, weekly_new_users_previous),
        },
        {
            "key": "weekly_created_activities",
            "label": "Actividades creadas",
            "current": weekly_activities_created_current,
            "previous": weekly_activities_created_previous,
            "change": _percentage_change(
                weekly_activities_created_current,
                weekly_activities_created_previous,
            ),
        },
    ]

    recent_qs = (
        Activity.objects.annotate(total_enrollments=Count("enrollments"))
        .order_by("-start", "-created_at")
        [:5]
    )
    recent_activities = [
        {
            "id": activity.id,
            "title": activity.title,
            "category": activity.get_category_display(),
            "status": activity.status,
            "start": activity.start.isoformat() if activity.start else None,
            "end": activity.end.isoformat() if activity.end else None,
            "created_at": activity.created_at.isoformat() if activity.created_at else None,
            "updated_at": activity.updated_at.isoformat() if activity.updated_at else None,
            "capacity": activity.capacity,
            "available_spots": activity.available_spots,
            "actual_attendees": activity.actual_attendees,
            "enrollments": activity.total_enrollments,
        }
        for activity in recent_qs
    ]

    payload = {
        "summary_cards": summary_cards,
        "weekly_metrics": weekly_metrics,
        "recent_activities": recent_activities,
        "generated_at": now.isoformat(),
    }

    return Response(payload, status=200)
