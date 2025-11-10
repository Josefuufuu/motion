"""
Comprehensive tests for Check-in functionality
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
        is_staff=True,
        is_superuser=True
    )
    UserProfile.objects.get_or_create(
        user=user,
        defaults={
            'role': 'ADMIN',
            'phone_number': '1234567890',
            'program': 'Admin',
            'semester': 1
        }
    )
    return user


@pytest.fixture
def professor_user(db):
    user = User.objects.create_user(
        username='professor1',
        email='professor1@test.com',
        password='prof123'
    )
    UserProfile.objects.get_or_create(
        user=user,
        defaults={
            'role': 'PROFESSOR',
            'phone_number': '1111111111',
            'program': 'Engineering',
            'semester': 1
        }
    )
    return user


@pytest.fixture
def beneficiary_user(db):
    user = User.objects.create_user(
        username='student1',
        email='student1@test.com',
        password='student123'
    )
    UserProfile.objects.get_or_create(
        user=user,
        defaults={
            'role': 'BENEFICIARY',
            'phone_number': '2222222222',
            'program': 'Computer Science',
            'semester': 5
        }
    )
    return user


@pytest.fixture
def activity_with_professor(db, admin_user, professor_user):
    return Activity.objects.create(
        title='Professor Activity',
        category='DEPORTE',
        description='Activity with professor',
        location='Gym A',
        start=timezone.now() + timedelta(days=1),
        end=timezone.now() + timedelta(days=1, hours=1),
        capacity=20,
        available_spots=20,
        assigned_professor=professor_user,
        created_by=admin_user
    )


@pytest.mark.django_db
class TestCheckinTokenGeneration:
    """Test check-in token generation"""

    def test_professor_can_generate_checkin_token(self, api_client, professor_user, activity_with_professor):
        api_client.force_authenticate(user=professor_user)
        response = api_client.post(f'/api/actividades/{activity_with_professor.id}/generate-checkin/')

        assert response.status_code == 200
        assert 'token' in response.data
        assert 'expires_at' in response.data
        assert 'checkin_url' in response.data

        activity_with_professor.refresh_from_db()
        assert activity_with_professor.checkin_token is not None
        assert activity_with_professor.checkin_expires_at is not None

    def test_non_professor_cannot_generate_token(self, api_client, beneficiary_user, activity_with_professor):
        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.post(f'/api/actividades/{activity_with_professor.id}/generate-checkin/')
        assert response.status_code == 403

    def test_professor_cannot_generate_token_for_unassigned_activity(self, api_client, professor_user, admin_user):
        other_activity = Activity.objects.create(
            title='Other Activity',
            category='CULTURA',
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=2),
            capacity=30,
            created_by=admin_user
        )

        api_client.force_authenticate(user=professor_user)
        response = api_client.post(f'/api/actividades/{other_activity.id}/generate-checkin/')
        assert response.status_code == 403

    def test_token_regeneration_replaces_old_token(self, api_client, professor_user, activity_with_professor):
        api_client.force_authenticate(user=professor_user)

        # Generate first token
        response1 = api_client.post(f'/api/actividades/{activity_with_professor.id}/generate-checkin/')
        token1 = response1.data['token']

        # Generate second token
        response2 = api_client.post(f'/api/actividades/{activity_with_professor.id}/generate-checkin/')
        token2 = response2.data['token']

        assert token1 != token2

        activity_with_professor.refresh_from_db()
        assert activity_with_professor.checkin_token == token2


@pytest.mark.django_db
class TestCheckinProcess:
    """Test check-in process with token"""

    def test_successful_checkin_with_valid_token(self, api_client, professor_user, beneficiary_user, activity_with_professor):
        # Generate token
        api_client.force_authenticate(user=professor_user)
        token_response = api_client.post(f'/api/actividades/{activity_with_professor.id}/generate-checkin/')
        token = token_response.data['token']

        # Student checks in
        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.post('/api/actividades/checkin/', {'token': token}, format='json')

        assert response.status_code == 200
        assert response.data['attended'] is True
        assert 'activity_id' in response.data

        # Verify enrollment was created and marked as attended
        enrollment = ActivityEnrollment.objects.get(
            user=beneficiary_user,
            activity=activity_with_professor
        )
        assert enrollment.attended is True

    def test_checkin_creates_enrollment_if_not_exists(self, api_client, professor_user, beneficiary_user, activity_with_professor):
        # Generate token
        api_client.force_authenticate(user=professor_user)
        token_response = api_client.post(f'/api/actividades/{activity_with_professor.id}/generate-checkin/')
        token = token_response.data['token']

        # Verify no enrollment exists
        assert not ActivityEnrollment.objects.filter(
            user=beneficiary_user,
            activity=activity_with_professor
        ).exists()

        # Check in
        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.post('/api/actividades/checkin/', {'token': token}, format='json')

        assert response.status_code == 200

        # Verify enrollment was created
        assert ActivityEnrollment.objects.filter(
            user=beneficiary_user,
            activity=activity_with_professor
        ).exists()

    def test_checkin_with_invalid_token_fails(self, api_client, beneficiary_user):
        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.post('/api/actividades/checkin/', {'token': 'invalid_token'}, format='json')
        assert response.status_code == 404

    def test_checkin_without_token_fails(self, api_client, beneficiary_user):
        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.post('/api/actividades/checkin/', {}, format='json')
        assert response.status_code == 400

    def test_checkin_with_expired_token_fails(self, api_client, professor_user, beneficiary_user, activity_with_professor):
        # Generate token
        api_client.force_authenticate(user=professor_user)
        token_response = api_client.post(f'/api/actividades/{activity_with_professor.id}/generate-checkin/')
        token = token_response.data['token']

        # Manually expire the token
        activity_with_professor.checkin_expires_at = timezone.now() - timedelta(minutes=1)
        activity_with_professor.save()

        # Try to check in with expired token
        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.post('/api/actividades/checkin/', {'token': token}, format='json')
        assert response.status_code == 400
        assert 'expirado' in response.data['detail'].lower()

    def test_checkin_updates_actual_attendees(self, api_client, professor_user, beneficiary_user, activity_with_professor):
        # Generate token
        api_client.force_authenticate(user=professor_user)
        token_response = api_client.post(f'/api/actividades/{activity_with_professor.id}/generate-checkin/')
        token = token_response.data['token']

        initial_attendees = activity_with_professor.actual_attendees

        # Check in
        api_client.force_authenticate(user=beneficiary_user)
        api_client.post('/api/actividades/checkin/', {'token': token}, format='json')

        activity_with_professor.refresh_from_db()
        assert activity_with_professor.actual_attendees == initial_attendees + 1

    def test_checkin_updates_available_spots(self, api_client, professor_user, beneficiary_user, activity_with_professor):
        # Generate token
        api_client.force_authenticate(user=professor_user)
        token_response = api_client.post(f'/api/actividades/{activity_with_professor.id}/generate-checkin/')
        token = token_response.data['token']

        initial_spots = activity_with_professor.available_spots

        # Check in
        api_client.force_authenticate(user=beneficiary_user)
        api_client.post('/api/actividades/checkin/', {'token': token}, format='json')

        activity_with_professor.refresh_from_db()
        assert activity_with_professor.available_spots == initial_spots - 1

    def test_double_checkin_does_not_duplicate(self, api_client, professor_user, beneficiary_user, activity_with_professor):
        # Generate token
        api_client.force_authenticate(user=professor_user)
        token_response = api_client.post(f'/api/actividades/{activity_with_professor.id}/generate-checkin/')
        token = token_response.data['token']

        # First check-in
        api_client.force_authenticate(user=beneficiary_user)
        response1 = api_client.post('/api/actividades/checkin/', {'token': token}, format='json')
        assert response1.data['already_marked'] is False

        attendees_after_first = activity_with_professor.actual_attendees
        activity_with_professor.refresh_from_db()
        attendees_after_first = activity_with_professor.actual_attendees

        # Second check-in (should not increase count)
        response2 = api_client.post('/api/actividades/checkin/', {'token': token}, format='json')
        assert response2.data['already_marked'] is True

        activity_with_professor.refresh_from_db()
        assert activity_with_professor.actual_attendees == attendees_after_first

    def test_checkin_unauthenticated_fails(self, api_client, professor_user, activity_with_professor):
        # Generate token
        api_client.force_authenticate(user=professor_user)
        token_response = api_client.post(f'/api/actividades/{activity_with_professor.id}/generate-checkin/')
        token = token_response.data['token']

        # Try to check in without authentication
        api_client.force_authenticate(user=None)
        response = api_client.post('/api/actividades/checkin/', {'token': token}, format='json')
        assert response.status_code == 401


@pytest.mark.django_db
class TestCheckinTokenExpiration:
    """Test token expiration logic"""

    def test_token_has_expiration_time(self, api_client, professor_user, activity_with_professor):
        api_client.force_authenticate(user=professor_user)
        response = api_client.post(f'/api/actividades/{activity_with_professor.id}/generate-checkin/')

        activity_with_professor.refresh_from_db()

        # Token should expire in the future
        assert activity_with_professor.checkin_expires_at > timezone.now()

        # Token should expire within expected TTL window (e.g., 10 minutes)
        expected_expiry = timezone.now() + timedelta(minutes=10)
        time_diff = abs((activity_with_professor.checkin_expires_at - expected_expiry).total_seconds())
        assert time_diff < 60  # Within 1 minute tolerance

    def test_expired_token_cannot_be_used(self, api_client, professor_user, beneficiary_user, activity_with_professor):
        # Generate token
        api_client.force_authenticate(user=professor_user)
        token_response = api_client.post(f'/api/actividades/{activity_with_professor.id}/generate-checkin/')
        token = token_response.data['token']

        # Manually set expiration to past
        activity_with_professor.checkin_expires_at = timezone.now() - timedelta(hours=1)
        activity_with_professor.save()

        # Try to use expired token
        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.post('/api/actividades/checkin/', {'token': token}, format='json')
        assert response.status_code == 400


@pytest.mark.django_db
class TestCheckinURL:
    """Test check-in URL generation"""

    def test_checkin_url_contains_token(self, api_client, professor_user, activity_with_professor):
        api_client.force_authenticate(user=professor_user)
        response = api_client.post(f'/api/actividades/{activity_with_professor.id}/generate-checkin/')

        checkin_url = response.data['checkin_url']
        token = response.data['token']

        assert token in checkin_url
        assert 'token=' in checkin_url

    def test_checkin_url_is_absolute(self, api_client, professor_user, activity_with_professor):
        api_client.force_authenticate(user=professor_user)
        response = api_client.post(f'/api/actividades/{activity_with_professor.id}/generate-checkin/')

        checkin_url = response.data['checkin_url']

        # URL should be absolute (start with http)
        assert checkin_url.startswith('http')

