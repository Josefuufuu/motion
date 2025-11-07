"""Views for the actividades app."""
from __future__ import annotations

import json
from typing import Any, Dict, Optional

from django import forms
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import redirect, render
from django.views.decorators.csrf import csrf_exempt

from .models import UserProfile


def index(request: HttpRequest) -> HttpResponse:
    """Render a minimal welcome page."""
    return HttpResponse("Bienvenidos al Centro Artístico y Deportivo")


def login_view(request: HttpRequest) -> HttpResponse:
    if request.method == "POST":
        form = AuthenticationForm(request=request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect("index")
    else:
        form = AuthenticationForm()

    return render(request, "login.html", {"form": form})


def register_view(request: HttpRequest) -> HttpResponse:
    if request.method == "POST":
        form = UserCreationForm(request.POST)
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

            return redirect("/")
    else:
        form = UserCreationForm()

    return render(request, "register.html", {"form": form})


def logout_view(request: HttpRequest) -> HttpResponse:
    logout(request)
    return redirect("/")


def _serialize_user(user) -> Dict[str, Any]:  # type: ignore[valid-type]
    """Return a serializable representation of a user instance."""
    return {
        "id": user.id,
        "username": user.get_username(),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
    }


def _load_body(request: HttpRequest) -> Optional[Dict[str, Any]]:
    try:
        if not request.body:
            return {}
        return json.loads(request.body.decode("utf-8"))
    except (TypeError, ValueError, json.JSONDecodeError):
        return None


def _resolve_username(identifier: Optional[str]) -> Optional[str]:
    if not identifier:
        return None

    if "@" in identifier:
        return identifier

    user_model = get_user_model()
    try:
        user = user_model.objects.get(email__iexact=identifier)
    except user_model.DoesNotExist:
        return None

    return user.get_username()


class ApiRegistrationForm(UserCreationForm):
    """UserCreationForm variant tailored for the JSON API."""

    email: forms.EmailField = forms.EmailField(required=True)

    class Meta(UserCreationForm.Meta):
        fields = UserCreationForm.Meta.fields + ("email",)

    def save(self, commit: bool = True):  # type: ignore[override]
        user = super().save(commit=False)
        user.email = self.cleaned_data["email"]

        if commit:
            user.save()
            profile, _ = UserProfile.objects.get_or_create(user=user)
            # No extra fields are required at the moment, but this is where
            # we would populate them if necessary using ``self.cleaned_data``.

        return user


@csrf_exempt
def api_login(request: HttpRequest) -> JsonResponse:
    if request.method != "POST":
        return JsonResponse(
            {"ok": False, "error": "Method not allowed"}, status=405
        )

    payload = _load_body(request)
    if payload is None:
        return JsonResponse({"ok": False, "error": "Invalid JSON"}, status=400)

    identifier = payload.get("username") or payload.get("email")
    password = payload.get("password")

    if not identifier or not password:
        return JsonResponse({"ok": False, "error": "Missing credentials"}, status=400)

    username = _resolve_username(identifier) or identifier
    user = authenticate(request, username=username, password=password)

    if user is None:
        return JsonResponse({"ok": False, "error": "Invalid credentials"}, status=401)

    login(request, user)
    return JsonResponse({"ok": True, "user": _serialize_user(user)}, status=200)


@csrf_exempt
def api_logout(request: HttpRequest) -> JsonResponse:
    if request.method != "POST":
        return JsonResponse(
            {"ok": False, "error": "Method not allowed"}, status=405
        )

    if not request.user.is_authenticated:
        return JsonResponse({"ok": False, "error": "Not authenticated"}, status=401)

    logout(request)
    return JsonResponse({"ok": True}, status=200)


@csrf_exempt
def api_session(request: HttpRequest) -> JsonResponse:
    if request.method != "GET":
        return JsonResponse(
            {"ok": False, "error": "Method not allowed"}, status=405
        )

    if not request.user.is_authenticated:
        return JsonResponse({"ok": False}, status=401)

    return JsonResponse({"ok": True, "user": _serialize_user(request.user)}, status=200)


@csrf_exempt
def api_register(request: HttpRequest) -> JsonResponse:
    """Create a user account from a JSON payload.

    Expected payload:
    {
        "username": "<str>",
        "email": "<str>",
        "password1": "<str>",
        "password2": "<str>"
    }
    """

    if request.method != "POST":
        return JsonResponse(
            {"ok": False, "error": "Method not allowed"}, status=405
        )

    payload = _load_body(request)
    if payload is None:
        return JsonResponse({"ok": False, "error": "Invalid JSON"}, status=400)

    form = ApiRegistrationForm(payload)
    if not form.is_valid():
        errors: Dict[str, Any] = {
            field: [str(err) for err in error_list]
            for field, error_list in form.errors.items()
        }
        return JsonResponse({"ok": False, "errors": errors}, status=400)

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
        logged_user = authenticated_user
    else:
        login(
            request,
            user,
            backend="django.contrib.auth.backends.ModelBackend",
        )
        logged_user = user

    return JsonResponse({"ok": True, "user": _serialize_user(logged_user)}, status=200)
