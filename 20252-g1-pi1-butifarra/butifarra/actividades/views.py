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
from datetime import datetime, timedelta, time

from django.utils import timezone
from django.db.models import Avg, Count, ExpressionWrapper, F, FloatField, Sum
from django.db.models.functions import TruncDate
from django.utils.dateparse import parse_date, parse_datetime
from rest_framework import viewsets, filters, permissions
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.reverse import reverse
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.db import transaction
from django.core.mail import send_mail, EmailMessage
from django.conf import settings

from .models import Activity, UserProfile, Tournament, ActivityEnrollment, TournamentEnrollment, Notification, Campaign, NotificationPreference, NotificationDeliveryLog
from .serializers import (
    ActivitySerializer,
    TournamentSerializer,
    ActivityEnrollmentSerializer,
    TournamentEnrollmentSerializer,
    NotificationSerializer,
    CampaignSerializer,
    NotificationPreferenceSerializer,
)

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

    activity_enrollments = (
        ActivityEnrollment.objects.filter(user=request.user)
        .select_related("activity")
        .order_by("-activity__start")
    )
    activities = [enrollment.activity for enrollment in activity_enrollments]
    activities_data = ActivitySerializer(
        activities, many=True, context={"request": request}
    ).data

    tournament_enrollments = (
        TournamentEnrollment.objects.filter(user=request.user)
        .select_related("tournament")
        .order_by("-tournament__start")
    )

    tournaments_data = []
    for enrollment in tournament_enrollments:
        tournament = enrollment.tournament
        tournaments_data.append(
            {
                "id": f"tournament-{tournament.id}",
                "title": tournament.name,
                "description": tournament.description,
                "location": tournament.location,
                "start": tournament.start,
                "end": tournament.end,
                "category": tournament.sport or "Torneo",
                "status": tournament.status,
                "visibility": tournament.visibility,
                "type": "tournament",
                "max_teams": tournament.max_teams,
                "current_teams": tournament.current_teams,
            }
        )

    payload = {
        "activities": activities_data,
        "tournaments": tournaments_data,
    }

    return JsonResponse(payload, status=200)


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
    authentication_classes = [SessionAuthentication]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['sport', 'status', 'visibility']
    search_fields = ['name', 'description', 'location']

    def get_queryset(self):
        qs = super().get_queryset()
        return qs.prefetch_related('enrollments__user__profile').select_related('created_by')

    def perform_create(self, serializer):
        """
        Set the created_by field to the current user when creating a tournament
        """
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='enroll', permission_classes=[permissions.IsAuthenticated])
    def enroll(self, request, pk=None):
        tournament = self.get_object()
        today = timezone.localdate()

        if tournament.status in {"finished", "cancelled"}:
            return Response({'detail': 'El torneo no admite inscripciones en este estado.'}, status=400)

        if tournament.inscription_start and today < tournament.inscription_start:
            return Response({'detail': 'Las inscripciones aún no están abiertas.'}, status=400)

        if tournament.inscription_end and today > tournament.inscription_end:
            return Response({'detail': 'El periodo de inscripciones ha finalizado.'}, status=400)

        with transaction.atomic():
            tournament = Tournament.objects.select_for_update().get(pk=tournament.pk)
            active_count = TournamentEnrollment.objects.filter(
                tournament=tournament,
                status__in=TournamentEnrollment._active_statuses(),
            ).count()

            existing_enrollment = TournamentEnrollment.objects.filter(
                tournament=tournament, user=request.user
            ).select_for_update().first()

            if existing_enrollment and existing_enrollment.is_active:
                return Response({'detail': 'Ya estás inscrito en este torneo.'}, status=400)

            max_teams = tournament.max_teams or 0
            if max_teams and active_count >= max_teams and not (existing_enrollment and existing_enrollment.is_active):
                return Response({'detail': 'No hay cupos disponibles.'}, status=400)

            if existing_enrollment:
                existing_enrollment.status = TournamentEnrollment.STATUS_CONFIRMED
                existing_enrollment.save()
                enrollment = existing_enrollment
                created = False
            else:
                enrollment = TournamentEnrollment.objects.create(
                    tournament=tournament,
                    user=request.user,
                    status=TournamentEnrollment.STATUS_CONFIRMED,
                )
                created = True

        tournament.refresh_from_db()
        serializer = self.get_serializer(tournament)
        enrollment_data = TournamentEnrollmentSerializer(
            enrollment, context=self.get_serializer_context()
        ).data
        detail = 'Inscripción registrada correctamente.' if created else 'Inscripción reactivada.'
        return Response(
            {
                'detail': detail,
                'tournament': serializer.data,
                'enrollment': enrollment_data,
            },
            status=201 if created else 200,
        )

    @action(detail=True, methods=['post'], url_path='unenroll', permission_classes=[permissions.IsAuthenticated])
    def unenroll(self, request, pk=None):
        tournament = self.get_object()

        with transaction.atomic():
            tournament = Tournament.objects.select_for_update().get(pk=tournament.pk)
            try:
                enrollment = TournamentEnrollment.objects.select_for_update().get(
                    tournament=tournament, user=request.user
                )
            except TournamentEnrollment.DoesNotExist:
                return Response({'detail': 'No tienes una inscripción registrada.'}, status=400)

            if not enrollment.is_active:
                return Response({'detail': 'La inscripción ya está cancelada.'}, status=400)

            enrollment.status = TournamentEnrollment.STATUS_CANCELLED
            enrollment.save()

        tournament.refresh_from_db()
        serializer = self.get_serializer(tournament)
        return Response(
            {
                'detail': 'Inscripción cancelada correctamente.',
                'tournament': serializer.data,
            },
            status=200,
        )

    @action(
        detail=True,
        methods=['get'],
        url_path='enrollments',
        permission_classes=[permissions.IsAdminUser],
    )
    def list_enrollments(self, request, pk=None):
        tournament = self.get_object()
        enrollments = tournament.enrollments.select_related('user', 'user__profile').order_by('-created_at')
        serializer = TournamentEnrollmentSerializer(enrollments, many=True, context=self.get_serializer_context())
        return Response(serializer.data)


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

    category_labels = dict(Activity.CATEGORY_CHOICES)

    def _parse_bound(value, is_start=True):
        if not value:
            return None

        parsed_dt = parse_datetime(value)
        if parsed_dt is None:
            parsed_date = parse_date(value)
            if parsed_date is None:
                return None
            parsed_dt = datetime.combine(
                parsed_date,
                time.min if is_start else time.max,
            )

        if timezone.is_naive(parsed_dt):
            parsed_dt = timezone.make_aware(parsed_dt, timezone.get_current_timezone())
        return parsed_dt

    filters_applied = {}

    activities_qs = Activity.objects.all()
    enrollments_qs = ActivityEnrollment.objects.select_related("activity").all()
    users_qs = User.objects.all()

    params = getattr(request, "query_params", request.GET)

    range_start = range_end = None
    errors = {}

    start_param = params.get("start_date")
    end_param = params.get("end_date")

    if start_param or end_param:
        if start_param:
            range_start = _parse_bound(start_param, is_start=True)
            if range_start is None:
                errors["start_date"] = "Formato de fecha inválido. Use YYYY-MM-DD o un datetime ISO 8601."
        if end_param:
            range_end = _parse_bound(end_param, is_start=False)
            if range_end is None:
                errors["end_date"] = "Formato de fecha inválido. Use YYYY-MM-DD o un datetime ISO 8601."
        if range_start and range_end and range_start > range_end:
            errors["date_range"] = "start_date no puede ser posterior a end_date."
    else:
        date_range = params.get("date_range")
        if date_range:
            parts = [part.strip() for part in date_range.split(",")]
            if parts:
                range_start = _parse_bound(parts[0], is_start=True)
                if parts[0] and range_start is None:
                    errors["date_range_start"] = "Formato de fecha inválido en date_range."
                if len(parts) > 1:
                    range_end = _parse_bound(parts[1], is_start=False)
                    if parts[1] and range_end is None:
                        errors["date_range_end"] = "Formato de fecha inválido en date_range."
                elif parts[0]:
                    range_end = _parse_bound(parts[0], is_start=False)
                    if range_end is None:
                        errors["date_range_end"] = "Formato de fecha inválido en date_range."
                if range_start and range_end and range_start > range_end:
                    errors["date_range"] = "El inicio del rango no puede ser posterior al final."

    valid_categories = {choice[0] for choice in Activity.CATEGORY_CHOICES}
    activity_types = []

    if hasattr(params, "getlist"):
        raw_types = params.getlist("activity_type")
    else:
        raw_types = [params.get("activity_type")]

    raw_types = [item for item in raw_types if item]
    if raw_types:
        if len(raw_types) == 1 and "," in raw_types[0]:
            activity_types = [value.strip() for value in raw_types[0].split(",") if value.strip()]
        else:
            for value in raw_types:
                activity_types.extend([v.strip() for v in value.split(",") if v.strip()])

        invalid_types = [value for value in activity_types if value not in valid_categories]
        if invalid_types:
            errors["activity_type"] = f"Tipos de actividad inválidos: {', '.join(sorted(set(invalid_types)))}"

    if errors:
        return Response({"detail": "Parámetros inválidos", "errors": errors}, status=400)

    if range_start:
        activities_qs = activities_qs.filter(start__gte=range_start)
        enrollments_qs = enrollments_qs.filter(activity__start__gte=range_start)
        users_qs = users_qs.filter(date_joined__gte=range_start)
        filters_applied["start_date"] = range_start.isoformat()
    if range_end:
        activities_qs = activities_qs.filter(start__lte=range_end)
        enrollments_qs = enrollments_qs.filter(activity__start__lte=range_end)
        users_qs = users_qs.filter(date_joined__lte=range_end)
        filters_applied["end_date"] = range_end.isoformat()

    if activity_types:
        activities_qs = activities_qs.filter(category__in=activity_types)
        enrollments_qs = enrollments_qs.filter(activity__category__in=activity_types)
        filters_applied["activity_types"] = activity_types

    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day + timedelta(days=1)

    todays_attendance = enrollments_qs.filter(
        attended=True,
        activity__start__gte=start_of_day,
        activity__start__lt=end_of_day,
    ).count()
    yesterdays_attendance = enrollments_qs.filter(
        attended=True,
        activity__start__gte=start_of_day - timedelta(days=1),
        activity__start__lt=start_of_day,
    ).count()

    open_enrollments = activities_qs.filter(
        status="active",
        start__gte=now,
        available_spots__gt=0,
    ).count()
    open_enrollments_previous = activities_qs.filter(
        status="active",
        start__gte=now - timedelta(days=14),
        start__lt=now - timedelta(days=7),
        available_spots__gt=0,
    ).count()

    week_start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    week_end = week_start + timedelta(days=7)
    previous_week_start = week_start - timedelta(days=7)

    occupancy_current = _average_occupancy(
        activities_qs.filter(
            start__gte=week_start,
            start__lt=week_end,
            capacity__gt=0,
        )
    )
    occupancy_previous = _average_occupancy(
        activities_qs.filter(
            start__gte=previous_week_start,
            start__lt=week_start,
            capacity__gt=0,
        )
    )

    incidents_current = activities_qs.filter(
        status="cancelled",
        updated_at__gte=now - timedelta(days=7),
    ).count()
    incidents_previous = activities_qs.filter(
        status="cancelled",
        updated_at__gte=now - timedelta(days=14),
        updated_at__lt=now - timedelta(days=7),
    ).count()

    weekly_attendance_current = enrollments_qs.filter(
        attended=True,
        activity__start__gte=week_start,
        activity__start__lt=week_end,
    ).count()
    weekly_attendance_previous = enrollments_qs.filter(
        attended=True,
        activity__start__gte=previous_week_start,
        activity__start__lt=week_start,
    ).count()

    weekly_new_users_current = users_qs.filter(
        date_joined__gte=week_start,
        date_joined__lt=week_end,
    ).count()
    weekly_new_users_previous = users_qs.filter(
        date_joined__gte=previous_week_start,
        date_joined__lt=week_start,
    ).count()

    weekly_activities_created_current = activities_qs.filter(
        created_at__gte=week_start,
        created_at__lt=week_end,
    ).count()
    weekly_activities_created_previous = activities_qs.filter(
        created_at__gte=previous_week_start,
        created_at__lt=week_start,
    ).count()

    participation_by_type = [
        {
            "category": item["activity__category"],
            "label": category_labels.get(item["activity__category"], item["activity__category"]),
            "attendees": item["total"],
        }
        for item in enrollments_qs.filter(attended=True)
        .values("activity__category")
        .annotate(total=Count("id"))
        .order_by("-total")
    ]

    attendance_series = [
        {
            "date": entry["day"].isoformat() if entry["day"] else None,
            "attendees": entry["total"],
        }
        for entry in enrollments_qs.filter(attended=True)
        .annotate(day=TruncDate("activity__start"))
        .values("day")
        .annotate(total=Count("id"))
        .order_by("day")
    ]

    enrollment_series = [
        {
            "date": entry["day"].isoformat() if entry["day"] else None,
            "enrollments": entry["total"],
        }
        for entry in enrollments_qs
        .annotate(day=TruncDate("activity__start"))
        .values("day")
        .annotate(total=Count("id"))
        .order_by("day")
    ]

    new_users_series = [
        {
            "date": entry["day"].isoformat() if entry["day"] else None,
            "users": entry["total"],
        }
        for entry in users_qs
        .annotate(day=TruncDate("date_joined"))
        .values("day")
        .annotate(total=Count("id"))
        .order_by("day")
    ]

    capacity_vs_attendance = []
    for item in (
        activities_qs.filter(capacity__gt=0)
        .values("category")
        .annotate(
            total_capacity=Sum("capacity"),
            total_attendees=Sum("actual_attendees"),
        )
    ):
        capacity = item["total_capacity"] or 0
        attendees = item["total_attendees"] or 0
        ratio = (attendees / capacity * 100.0) if capacity else None
        capacity_vs_attendance.append(
            {
                "category": item["category"],
                "label": category_labels.get(item["category"], item["category"]),
                "capacity": capacity,
                "attendees": attendees,
                "occupancy_percentage": ratio,
            }
        )

    chart_datasets = {
        "participation_by_type": participation_by_type,
        "attendance_series": attendance_series,
        "enrollment_series": enrollment_series,
        "new_users_series": new_users_series,
        "capacity_vs_attendance": capacity_vs_attendance,
    }

    dataset_documentation = {
        "participation_by_type": "Lista de categorías con asistentes (campos: category, label, attendees)",
        "attendance_series": "Serie temporal diaria con total de asistentes (campos: date, attendees)",
        "enrollment_series": "Serie temporal diaria con total de inscripciones (campos: date, enrollments)",
        "new_users_series": "Serie temporal diaria de usuarios registrados (campos: date, users)",
        "capacity_vs_attendance": "Totales de capacidad vs asistentes por categoría (campos: category, label, capacity, attendees, occupancy_percentage)",
    }

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
        activities_qs.annotate(total_enrollments=Count("enrollments"))
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
        "chart_datasets": chart_datasets,
        "participation_by_type": participation_by_type,
        "attendance_series": attendance_series,
        "enrollment_series": enrollment_series,
        "new_users_series": new_users_series,
        "dataset_documentation": dataset_documentation,
        "filters_applied": filters_applied,
        "generated_at": now.isoformat(),
    }

    return Response(payload, status=200)

# ======================
# Notification ViewSets
# ======================
class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        qs = self.get_queryset().exclude(status='read')
        updated = 0
        now = timezone.now()
        for notif in qs:
            notif.status = 'read'
            notif.read_at = now
            notif.save(update_fields=['status', 'read_at'])
            updated += 1
        return Response({'marked': updated})

    @action(detail=True, methods=['post'], url_path='read')
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        if notif.status != 'read':
            notif.mark_read()
        return Response({'ok': True, 'id': notif.id, 'status': notif.status, 'read_at': notif.read_at})

    @action(detail=False, methods=['get'], url_path='campaigns')
    def list_campaigns(self, request):
        profile = getattr(request.user, 'profile', None)
        if not (request.user.is_staff or request.user.is_superuser or (profile and profile.is_admin)):
            return Response({'detail': 'No autorizado'}, status=403)
        qs = Campaign.objects.order_by('-created_at')[:20]
        data = CampaignSerializer(qs, many=True, context={'request': request}).data
        return Response(data)

    @action(detail=True, methods=['get'], url_path='campaign')
    def get_campaign(self, request, pk=None):
        profile = getattr(request.user, 'profile', None)
        if not (request.user.is_staff or request.user.is_superuser or (profile and profile.is_admin)):
            return Response({'detail': 'No autorizado'}, status=403)
        try:
            camp = Campaign.objects.get(pk=pk)
        except Campaign.DoesNotExist:
            return Response({'detail': 'No encontrado'}, status=404)
        data = CampaignSerializer(camp, context={'request': request}).data
        return Response(data)

    @action(detail=False, methods=['post'], url_path='broadcast')
    def broadcast(self, request):
        profile = getattr(request.user, 'profile', None)
        if not (request.user.is_staff or request.user.is_superuser or (profile and profile.is_admin)):
            return Response({'detail': 'No autorizado'}, status=403)
        payload = request.data
        name = payload.get('name') or payload.get('title') or 'Campaña'
        message = payload.get('message') or payload.get('body') or ''
        channel_opt = payload.get('channel') or 'AMBOS'
        segment = payload.get('segment') or 'Todos los usuarios'
        selected_ids = payload.get('selected_user_ids') or []
        schedule_date = payload.get('scheduleDate')
        schedule_time = payload.get('scheduleTime')
        schedule_at = None
        if schedule_date and schedule_time:
            try:
                dt_str = f"{schedule_date} {schedule_time}"
                schedule_at = datetime.fromisoformat(dt_str)
                if timezone.is_naive(schedule_at):
                    schedule_at = timezone.make_aware(schedule_at, timezone.get_current_timezone())
            except Exception:
                schedule_at = None
        camp = Campaign.objects.create(
            name=name,
            message=message,
            channel_option=channel_opt,
            segment=segment,
            selected_user_ids=selected_ids,
            schedule_at=schedule_at,
            created_by=request.user,
        )

        # Determine recipients
        users_qs = User.objects.all().select_related('profile')
        if segment == 'Solo Estudiantes':
            users_qs = users_qs.filter(profile__role='BENEFICIARY')
        elif segment == 'Solo Profesores':
            users_qs = users_qs.filter(profile__role='PROFESSOR')
        elif segment == 'Seleccionados':
            users_qs = users_qs.filter(id__in=selected_ids)

        recipients = list(users_qs)

        channels = []
        if channel_opt == 'AMBOS':
            channels = ['email', 'app']
        elif channel_opt == 'CORREO':
            channels = ['email']
        elif channel_opt == 'PUSH':
            channels = ['app']

        notifs = []
        now = timezone.now()
        # Read flag from settings
        try:
            from django.conf import settings
            send_email_immediate = getattr(settings, 'SEND_EMAIL_IMMEDIATE', True)
        except Exception:
            send_email_immediate = True

        for user in recipients:
            prefs = getattr(user, 'notification_preferences', None)
            for ch in channels:
                # Respect preferences
                if ch == 'app' and prefs and not prefs.app_enabled:
                    continue
                if ch == 'email' and prefs and not prefs.email_enabled:
                    continue
                # Determine initial status
                if ch == 'app':
                    status = 'sent'
                    sent_at = now
                    scheduled_for = None
                else:
                    # email
                    if schedule_at and schedule_at > now:
                        status = 'scheduled'
                        sent_at = None
                        scheduled_for = schedule_at
                    else:
                        # No programación o en el pasado: enviar ahora
                        status = 'pending'
                        sent_at = None
                        scheduled_for = None
                notifs.append(
                    Notification(
                        user=user,
                        campaign=camp,
                        title=name,
                        body=message,
                        channel=ch,
                        status=status,
                        scheduled_for=scheduled_for,
                        sent_at=sent_at,
                        metadata={'type': 'campaign'}
                    )
                )
        if notifs:
            Notification.objects.bulk_create(notifs)

        # Envío inmediato de email si flag y no hay programación futura (o programación pasada)
        email_queue = 0
        try:
            immediate_window = True if (schedule_at is None or schedule_at <= timezone.now()) else False
        except Exception:
            immediate_window = True

        if send_email_immediate and immediate_window:
            email_notifs = Notification.objects.filter(campaign=camp, channel='email', status='pending')
            for n in email_notifs:
                try:
                    if settings.EMAIL_HOST_USER and settings.EMAIL_HOST_PASSWORD:
                        if not n.user.email:
                            raise ValueError('Usuario sin email')
                        msg = EmailMessage(
                            subject=n.title,
                            body=n.body,
                            from_email=settings.DEFAULT_FROM_EMAIL or settings.EMAIL_HOST_USER,
                            to=[n.user.email],
                        )
                        msg.send(fail_silently=False)
                        n.mark_sent()
                        NotificationDeliveryLog.objects.create(
                            notification=n,
                            channel='email',
                            status='success',
                            detail='Email enviado correctamente'
                        )
                        email_queue += 1
                    else:
                        NotificationDeliveryLog.objects.create(
                            notification=n,
                            channel='email',
                            status='error',
                            detail='Credenciales de SMTP faltantes'
                        )
                        n.status = 'failed'
                        n.save(update_fields=['status'])
                except Exception as exc:
                    NotificationDeliveryLog.objects.create(
                        notification=n,
                        channel='email',
                        status='error',
                        detail=f'Error al enviar: {exc}'
                    )
                    n.status = 'failed'
                    n.save(update_fields=['status'])

        camp.update_metrics()

        return Response({
            'created': len(notifs),
            'app_sent': camp.app_sent,
            'email_queue': email_queue,
            'campaign_id': camp.id,
        }, status=201)


class CampaignViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CampaignSerializer
    queryset = Campaign.objects.all().order_by('-created_at')
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, *args, **kwargs):
        profile = getattr(request.user, 'profile', None)
        if not (request.user.is_staff or request.user.is_superuser or (profile and profile.is_admin)):
            return Response({'detail': 'No autorizado'}, status=403)
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        profile = getattr(request.user, 'profile', None)
        if not (request.user.is_staff or request.user.is_superuser or (profile and profile.is_admin)):
            return Response({'detail': 'No autorizado'}, status=403)
        return super().retrieve(request, *args, **kwargs)


@api_view(['GET', 'PATCH'])
@login_required
def api_notification_preferences(request):
    prefs, _ = NotificationPreference.objects.get_or_create(user=request.user)
    if request.method == 'GET':
        return Response(NotificationPreferenceSerializer(prefs).data)
    # PATCH
    serializer = NotificationPreferenceSerializer(prefs, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)
