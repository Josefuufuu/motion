import pytest
from datetime import timedelta

from django.contrib.auth.models import User
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from butifarra.actividades.models import Activity, ActivityEnrollment


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def professor_user(db):
    user = User.objects.create_user(
        username='profesor',
        email='profesor@example.com',
        password='password123',
    )
    profile = user.profile
    profile.role = 'PROFESSOR'
    profile.save()
    return user


@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='adminpass',
    )


@pytest.fixture
def activity(db, professor_user, admin_user):
    return Activity.objects.create(
        title='Actividad de prueba',
        category='DEPORTE',
        description='Prueba de check-in',
        location='Lugar 1',
        start=timezone.now() + timedelta(days=1),
        end=timezone.now() + timedelta(days=1, hours=2),
        capacity=10,
        available_spots=10,
        instructor='Profesor',
        assigned_professor=professor_user,
        visibility='public',
        status='active',
        tags=[],
        created_by=admin_user,
    )


@pytest.fixture
def beneficiary_user(db):
    user = User.objects.create_user(
        username='beneficiario',
        email='beneficiario@example.com',
        password='password123',
    )
    profile = user.profile
    profile.role = 'BENEFICIARY'
    profile.save()
    return user


def test_generate_checkin_token(api_client, professor_user, activity):
    api_client.force_authenticate(user=professor_user)
    url = reverse('activity-generate-checkin', kwargs={'pk': activity.pk})

    response = api_client.post(url)

    assert response.status_code == 200
    data = response.json()
    activity.refresh_from_db()
    assert activity.checkin_token == data['token']
    assert activity.checkin_expires_at is not None
    assert data['token'] in data['checkin_url']


def test_checkin_token_expired(api_client, professor_user, beneficiary_user, activity):
    api_client.force_authenticate(user=professor_user)
    url = reverse('activity-generate-checkin', kwargs={'pk': activity.pk})
    token_response = api_client.post(url)
    token = token_response.json()['token']

    activity.checkin_expires_at = timezone.now() - timedelta(minutes=1)
    activity.save(update_fields=['checkin_expires_at'])

    api_client.force_authenticate(user=beneficiary_user)
    checkin_url = reverse('activity-checkin')
    response = api_client.post(checkin_url, {'token': token}, format='json')

    assert response.status_code == 400
    assert response.json()['detail'] == 'Token expirado'


def test_checkin_registers_attendance(api_client, professor_user, beneficiary_user, activity):
    api_client.force_authenticate(user=professor_user)
    token = api_client.post(
        reverse('activity-generate-checkin', kwargs={'pk': activity.pk})
    ).json()['token']

    api_client.force_authenticate(user=beneficiary_user)
    checkin_url = reverse('activity-checkin')
    response = api_client.post(checkin_url, {'token': token}, format='json')

    assert response.status_code == 200
    data = response.json()
    enrollment = ActivityEnrollment.objects.get(user=beneficiary_user, activity=activity)
    assert enrollment.attended is True
    activity.refresh_from_db()
    assert activity.actual_attendees == 1
    assert activity.available_spots == 9
    assert data['already_marked'] is False

    second_response = api_client.post(checkin_url, {'token': token}, format='json')
    assert second_response.status_code == 200
    assert second_response.json()['already_marked'] is True
    activity.refresh_from_db()
    assert activity.actual_attendees == 1
