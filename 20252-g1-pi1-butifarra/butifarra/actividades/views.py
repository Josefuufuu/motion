import json

from django import forms
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect, render
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.contrib.auth.models import User
from django.views.decorators.csrf import ensure_csrf_cookie
from django.middleware.csrf import get_token
from django.db import models
import logging
from rest_framework import viewsets, filters, permissions
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend

from .models import Activity, UserProfile, Project, Enrollment
from .serializers import ActivitySerializer, ProjectSerializer, EnrollmentSerializer

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
            try:
                profile = user.profile
            except UserProfile.DoesNotExist:
                profile, _ = UserProfile.objects.get_or_create(user=user)

            profile.phone_number = self.cleaned_data["phone_number"]
            profile.program = self.cleaned_data["program"]
            profile.semester = self.cleaned_data["semester"]
            profile.save()

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
    """
    def has_permission(self, request, view):
        # Allow read operations for authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        # Check if user is admin for write operations
        if not request.user or not request.user.is_authenticated:
            return False

        # Check if user is staff, superuser, or has ADMIN role
        if request.user.is_staff or request.user.is_superuser:
            return True

        # Check user profile for ADMIN role
        profile = getattr(request.user, 'profile', None)
        if profile and profile.is_admin:
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
    filterset_fields = ['category', 'status', 'visibility']
    search_fields = ['title', 'description', 'location', 'instructor']

    def get_queryset(self):
        """
        Filter queryset based on query parameters
        """
        queryset = Activity.objects.all().order_by('-start')

        # Filter by date range
        from_date = self.request.query_params.get('from', None)
        to_date = self.request.query_params.get('to', None)
        category = self.request.query_params.get('category', None)
        q = self.request.query_params.get('q', None)

        if from_date:
            queryset = queryset.filter(start__gte=from_date)
        if to_date:
            queryset = queryset.filter(start__lte=to_date)
        if category:
            queryset = queryset.filter(category=category)
        if q:
            from django.db import models as django_models
            queryset = queryset.filter(
                django_models.Q(title__icontains=q) |
                django_models.Q(description__icontains=q) |
                django_models.Q(location__icontains=q) |
                django_models.Q(instructor__icontains=q)
            )

        return queryset

    def perform_create(self, serializer):
        """
        Set the created_by field to the current user when creating an activity
        """
        serializer.save(created_by=self.request.user)


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['type', 'status', 'area']
    search_fields = ['name', 'description', 'area', 'subtype']

    def get_queryset(self):
        queryset = Project.objects.all().order_by('-created_at')
        return queryset


class EnrollmentViewSet(viewsets.ModelViewSet):
    serializer_class = EnrollmentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['project', 'status']
    search_fields = ['full_name', 'email']

    def get_queryset(self):
        user = self.request.user

        if user.is_authenticated:
            profile = getattr(user, 'profile', None)
            if user.is_staff or user.is_superuser or (profile and profile.is_admin):
                return Enrollment.objects.all().order_by('-enrollment_date')
            else:
                return Enrollment.objects.filter(
                    models.Q(user=user) | models.Q(email=user.email)
                ).order_by('-enrollment_date')

        return Enrollment.objects.none()

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        elif self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        else:
            return [IsAdminOrReadOnly()]

    def perform_create(self, serializer):
        serializer.save()
