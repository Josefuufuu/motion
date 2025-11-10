"""
Tests for check-in functionality (simpler version focused on core checkin features)
"""
import pytest
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from actividades.models import Activity, ActivityEnrollment, UserProfile


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    user = User.objects.create_user(
        username='admin',
        email='admin@test.com',
        password='admin123',
        is_staff=True
    )
    UserProfile.objects.get_or_create(user=user, defaults={'role': 'ADMIN', 'phone_number': '1234567890', 'program': 'Admin', 'semester': 1})
    return user


@pytest.fixture
def professor_user(db):
    user = User.objects.create_user(
        username='professor1',
        email='professor1@test.com',
        password='prof123'
    )
    UserProfile.objects.get_or_create(user=user, defaults={'role': 'PROFESSOR', 'phone_number': '1111111111', 'program': 'Eng', 'semester': 1})
    return user


@pytest.fixture
def student_user(db):
    user = User.objects.create_user(
        username='student1',
        email='student1@test.com',
        password='student123'
    )
    UserProfile.objects.get_or_create(user=user, defaults={'role': 'BENEFICIARY', 'phone_number': '2222222222', 'program': 'CS', 'semester': 5})
    return user


@pytest.mark.django_db
class TestCheckInBasics:
    """Basic check-in functionality tests"""

    def test_professor_generates_checkin_token(self, api_client, professor_user, admin_user):
        activity = Activity.objects.create(
            title='Test Activity',
            category='DEPORTE',
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=2),
            capacity=20,
            assigned_professor=professor_user,
            created_by=admin_user
        )

        api_client.force_authenticate(user=professor_user)
        response = api_client.post(f'/api/actividades/{activity.id}/generate-checkin/')
        assert response.status_code == 200
        assert 'token' in response.data

    def test_student_checks_in_with_valid_token(self, api_client, professor_user, student_user, admin_user):
        activity = Activity.objects.create(
            title='CheckIn Activity',
            category='DEPORTE',
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=2),
            capacity=20,
            assigned_professor=professor_user,
            created_by=admin_user
        )

        # Generate token
        api_client.force_authenticate(user=professor_user)
        token_resp = api_client.post(f'/api/actividades/{activity.id}/generate-checkin/')
        token = token_resp.data['token']

        # Check in
        api_client.force_authenticate(user=student_user)
        response = api_client.post('/api/actividades/checkin/', {'token': token}, format='json')
        assert response.status_code == 200

    def test_invalid_token_fails(self, api_client, student_user):
        api_client.force_authenticate(user=student_user)
        response = api_client.post('/api/actividades/checkin/', {'token': 'invalid'}, format='json')
        assert response.status_code == 404

