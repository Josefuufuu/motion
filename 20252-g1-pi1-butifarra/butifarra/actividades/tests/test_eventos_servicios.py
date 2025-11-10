"""
Tests for Events and Services (Activities and Tournaments general functionality)
"""
import pytest
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from actividades.models import Activity, Tournament, UserProfile


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
def beneficiary_user(db):
    user = User.objects.create_user(
        username='student1',
        email='student1@test.com',
        password='student123'
    )
    UserProfile.objects.get_or_create(user=user, defaults={'role': 'BENEFICIARY', 'phone_number': '2222222222', 'program': 'CS', 'semester': 5})
    return user


@pytest.mark.django_db
class TestActivitiesService:
    """Test activities as a service"""

    def test_create_activity_service(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        data = {
            'title': 'Service Activity',
            'category': 'BIENESTAR',
            'description': 'Wellness service',
            'location': 'Wellness Center',
            'start': (timezone.now() + timedelta(days=1)).isoformat(),
            'end': (timezone.now() + timedelta(days=1, hours=1)).isoformat(),
            'capacity': 15,
            'visibility': 'public',
            'status': 'active'
        }
        response = api_client.post('/api/actividades/', data, format='json')
        assert response.status_code == 201

    def test_list_active_services(self, api_client, admin_user, beneficiary_user):
        Activity.objects.create(
            title='Active Service',
            category='BIENESTAR',
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=2),
            capacity=10,
            status='active',
            created_by=admin_user
        )

        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get('/api/actividades/?status=active')
        assert response.status_code == 200


@pytest.mark.django_db
class TestTournamentsService:
    """Test tournaments as a service"""

    def test_create_tournament_event(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        today = timezone.now().date()
        data = {
            'name': 'Championship Event',
            'sport': 'Volleyball',
            'format': '6v6',
            'description': 'Annual championship',
            'location': 'Main Court',
            'inscription_start': today.isoformat(),
            'inscription_end': (today + timedelta(days=7)).isoformat(),
            'start': (timezone.now() + timedelta(days=10)).isoformat(),
            'end': (timezone.now() + timedelta(days=12)).isoformat(),
            'visibility': 'public',
            'status': 'planned',
            'max_teams': 12
        }
        response = api_client.post('/api/torneos/', data, format='json')
        assert response.status_code == 201

    def test_list_public_tournaments(self, api_client, admin_user, beneficiary_user):
        Tournament.objects.create(
            name='Public Tournament',
            sport='Tennis',
            start=timezone.now() + timedelta(days=5),
            end=timezone.now() + timedelta(days=7),
            max_teams=8,
            visibility='public',
            created_by=admin_user
        )

        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get('/api/torneos/')
        assert response.status_code == 200


@pytest.mark.django_db
class TestEventCategories:
    """Test event categorization"""

    def test_deporte_category(self, api_client, admin_user, beneficiary_user):
        Activity.objects.create(
            title='Sports Event',
            category='DEPORTE',
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=2),
            capacity=20,
            created_by=admin_user
        )

        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get('/api/actividades/?category=DEPORTE')
        assert response.status_code == 200

    def test_cultura_category(self, api_client, admin_user, beneficiary_user):
        Activity.objects.create(
            title='Cultural Event',
            category='CULTURA',
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=2),
            capacity=30,
            created_by=admin_user
        )

        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get('/api/actividades/?category=CULTURA')
        assert response.status_code == 200

