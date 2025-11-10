"""
Comprehensive tests for CADI (Centro Artístico y Deportivo Icesi) system
General integration tests and system-wide functionality
"""
import pytest
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from actividades.models import (
    Activity, Tournament, ActivityEnrollment, TournamentEnrollment,
    UserProfile, Notification
)


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


@pytest.mark.django_db
class TestCADISystemIntegration:
    """Test overall CADI system integration"""

    def test_system_allows_complete_activity_lifecycle(self, api_client, admin_user, beneficiary_user):
        """Test complete lifecycle: create activity, enroll, attend"""
        # Admin creates activity
        api_client.force_authenticate(user=admin_user)
        activity_data = {
            'title': 'Soccer Practice',
            'category': 'DEPORTE',
            'description': 'Weekly soccer practice',
            'location': 'Main Field',
            'start': (timezone.now() + timedelta(days=1)).isoformat(),
            'end': (timezone.now() + timedelta(days=1, hours=2)).isoformat(),
            'capacity': 20,
            'visibility': 'public',
            'status': 'active'
        }
        create_response = api_client.post('/api/actividades/', activity_data, format='json')
        assert create_response.status_code == 201
        activity_id = create_response.data['id']

        # Student enrolls
        api_client.force_authenticate(user=beneficiary_user)
        enroll_response = api_client.post(f'/api/actividades/{activity_id}/enroll/')
        assert enroll_response.status_code == 201

        # Verify enrollment
        enrollment = ActivityEnrollment.objects.get(
            user=beneficiary_user,
            activity_id=activity_id
        )
        assert enrollment is not None

    def test_user_can_view_all_their_activities(self, api_client, admin_user, beneficiary_user):
        """Test user can see all their enrolled activities and tournaments"""
        # Create and enroll in activity
        activity = Activity.objects.create(
            title='Yoga Class',
            category='DEPORTE',
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=1, hours=1),
            capacity=15,
            created_by=admin_user
        )
        ActivityEnrollment.objects.create(user=beneficiary_user, activity=activity)

        # Get user activities
        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get('/api/user/activities')

        assert response.status_code == 200
        assert 'activities' in response.data


@pytest.mark.django_db
class TestCADIPermissions:
    """Test CADI permission system"""

    def test_only_admin_can_create_activities(self, api_client, beneficiary_user):
        api_client.force_authenticate(user=beneficiary_user)
        data = {
            'title': 'Unauthorized Activity',
            'category': 'DEPORTE',
            'start': (timezone.now() + timedelta(days=1)).isoformat(),
            'end': (timezone.now() + timedelta(days=2)).isoformat(),
            'capacity': 10
        }
        response = api_client.post('/api/actividades/', data, format='json')
        assert response.status_code == 403

    def test_beneficiaries_can_view_public_activities(self, api_client, admin_user, beneficiary_user):
        activity = Activity.objects.create(
            title='Public Activity',
            category='CULTURA',
            visibility='public',
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=2),
            capacity=20,
            created_by=admin_user
        )

        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get(f'/api/actividades/{activity.id}/')
        assert response.status_code == 200

    def test_unauthenticated_users_cannot_access_system(self, api_client):
        response = api_client.get('/api/actividades/')
        assert response.status_code == 403


@pytest.mark.django_db
class TestCADISearchAndFilter:
    """Test search and filter functionality"""

    def test_search_activities_by_title(self, api_client, admin_user, beneficiary_user):
        Activity.objects.create(
            title='Yoga Morning',
            category='DEPORTE',
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=2),
            capacity=20,
            created_by=admin_user
        )

        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get('/api/actividades/?search=Yoga')
        assert response.status_code == 200

    def test_filter_activities_by_category(self, api_client, admin_user, beneficiary_user):
        Activity.objects.create(
            title='Sports Activity',
            category='DEPORTE',
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=2),
            capacity=20,
            created_by=admin_user
        )

        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get('/api/actividades/?category=DEPORTE')
        assert response.status_code == 200

