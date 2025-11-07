import json
from datetime import timedelta

import pytest
from django.test import Client
from django.utils import timezone


@pytest.mark.django_db
def test_api_login_sets_csrftoken(client, django_user_model):
    user = django_user_model.objects.create_user(
        username="user_login",
        email="user_login@example.com",
        password="secure-password",
    )

    response = client.post(
        "/api/login/",
        data=json.dumps({"username": user.username, "password": "secure-password"}),
        content_type="application/json",
    )

    assert response.status_code == 200
    assert "csrftoken" in response.cookies
    assert "csrftoken" in client.cookies


@pytest.mark.django_db
def test_api_session_sets_csrftoken(django_user_model):
    user = django_user_model.objects.create_user(
        username="user_session",
        email="user_session@example.com",
        password="secure-password",
    )

    session_client = Client()
    session_client.force_login(user)

    response = session_client.get("/api/session/")

    assert response.status_code == 200
    assert "csrftoken" in response.cookies
    assert "csrftoken" in session_client.cookies


@pytest.mark.django_db
def test_authenticated_post_with_csrf_token_succeeds(client, django_user_model):
    user = django_user_model.objects.create_user(
        username="user_activity",
        email="user_activity@example.com",
        password="secure-password",
    )

    login_response = client.post(
        "/api/login/",
        data=json.dumps({"username": user.username, "password": "secure-password"}),
        content_type="application/json",
    )

    assert login_response.status_code == 200
    csrftoken = client.cookies.get("csrftoken")
    assert csrftoken is not None

    now = timezone.now()
    payload = {
        "title": "Sesión de prueba",
        "category": "DEPORTE",
        "description": "Prueba de creación",
        "location": "Gimnasio",
        "start": (now + timedelta(hours=1)).isoformat(),
        "end": (now + timedelta(hours=2)).isoformat(),
        "capacity": 15,
        "available_spots": 15,
        "instructor": "Entrenador",
        "visibility": "public",
        "status": "active",
        "tags": [],
    }

    create_response = client.post(
        "/api/actividades/",
        data=json.dumps(payload),
        content_type="application/json",
        HTTP_X_CSRFTOKEN=csrftoken.value,
    )

    assert create_response.status_code == 201
