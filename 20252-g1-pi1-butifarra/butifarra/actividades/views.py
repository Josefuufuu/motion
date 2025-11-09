import json

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
from rest_framework import viewsets, filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from .models import Activity, UserProfile, Tournament, ActivityEnrollment
from .serializers import ActivitySerializer, TournamentSerializer, ActivityEnrollmentSerializer

# Set up logging
logger = logging.getLogger(__name__)

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


class UserProfileRegistrationForm(UserCreationForm):
    email = forms.EmailField(required=True)
    phone_number = forms.CharField(required=True, max_length=20)
    program = forms.CharField(required=True, max_length=120)
    semester = forms.IntegerField(required=True)

    class Meta(UserCreationForm.Meta):
        fields = (
            *UserCreationForm.Meta.fields,
            "email",
            "phone_number",
            "program",
            "semester",
        )

    field_order = (
        "username",
        "email",
        "phone_number",
        "program",
        "semester",
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
            UserProfile.objects.create(
                user=user,
                phone_number=self.cleaned_data["phone_number"],
                program=self.cleaned_data["program"],
                semester=self.cleaned_data["semester"],
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
        "semester": <int between 1 and 20>
    }
    """

    if request.method != "POST":
        return JsonResponse({"ok": False, "error": "Method not allowed"}, status=405)

    payload = _load_body(request)
    if payload is None:
        return JsonResponse({"ok": False, "error": "Invalid JSON"}, status=400)

    form = UserProfileRegistrationForm(payload)
    if not form.is_valid():
        errors = {field: [str(error) for error in error_list] for field, error_list in form.errors.items()}
        return JsonResponse({"ok": False, "errors": errors}, status=400)

    user = form.save()
    username = form.cleaned_data.get("username")
    password = form.cleaned_data.get("password1")

    authenticated_user = None
    if username and password:
        authenticated_user = authenticate(request, username=username, password=password)

    if authenticated_user is not None:
        login(request, authenticated_user)
        logged_user = authenticated_user
    else:
        login(
            request,
            user,
            backend="django.contrib.auth.backends.ModelBackend",
        )
        logged_user = user

    get_token(request)
    return JsonResponse({"ok": True, "user": _serialize_user(logged_user)}, status=200)


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
