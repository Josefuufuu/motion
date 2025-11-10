"""
Tests for Information and System Details
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
class TestActivityInformation:
    """Test activity information retrieval"""

    def test_get_activity_details(self, api_client, admin_user, beneficiary_user):
        activity = Activity.objects.create(
            title='Detailed Activity',
            category='DEPORTE',
            description='Full description here',
            location='Gym A',
            instructor='John Doe',
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=2),
            capacity=20,
            created_by=admin_user
        )

        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get(f'/api/actividades/{activity.id}/')
        assert response.status_code == 200
        assert response.data['title'] == 'Detailed Activity'
        assert response.data['description'] == 'Full description here'

    def test_activity_shows_capacity_info(self, api_client, admin_user, beneficiary_user):
        activity = Activity.objects.create(
            title='Capacity Activity',
            category='CULTURA',
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=2),
            capacity=25,
            available_spots=25,
            created_by=admin_user
        )

        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get(f'/api/actividades/{activity.id}/')
        assert response.status_code == 200
        assert response.data['capacity'] == 25
        assert response.data['available_spots'] == 25


@pytest.mark.django_db
class TestTournamentInformation:
    """Test tournament information retrieval"""

    def test_get_tournament_details(self, api_client, admin_user, beneficiary_user):
        tournament = Tournament.objects.create(
            name='Championship',
            sport='Basketball',
            format='5v5',
            description='Annual event',
            location='Sports Complex',
            start=timezone.now() + timedelta(days=5),
            end=timezone.now() + timedelta(days=7),
            max_teams=16,
            created_by=admin_user
        )

        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get(f'/api/torneos/{tournament.id}/')
        assert response.status_code == 200
        assert response.data['name'] == 'Championship'
        assert response.data['sport'] == 'Basketball'

    def test_tournament_shows_teams_info(self, api_client, admin_user, beneficiary_user):
        tournament = Tournament.objects.create(
            name='Teams Tournament',
            sport='Soccer',
            start=timezone.now() + timedelta(days=5),
            end=timezone.now() + timedelta(days=7),
            max_teams=10,
            current_teams=3,
            created_by=admin_user
        )

        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get(f'/api/torneos/{tournament.id}/')
        assert response.status_code == 200
        assert response.data['max_teams'] == 10
        assert response.data['current_teams'] == 3


@pytest.mark.django_db
class TestUserProfileInformation:
    """Test user profile information"""

    def test_get_user_session_info(self, api_client):
        user = User.objects.create_user(
            username='infouser',
            email='info@test.com',
            password='info123'
        )
        profile = user.profile
        profile.role = 'BENEFICIARY'
        profile.program = 'Engineering'
        profile.semester = 5
        profile.save()

        api_client.force_authenticate(user=user)
        response = api_client.get('/api/session/')
        assert response.status_code == 200
        assert response.data['user']['username'] == 'infouser'
        assert response.data['user']['profile']['role'] == 'BENEFICIARY'

    def test_professors_list_information(self, api_client):
        # Create professors
        for i in range(2):
            user = User.objects.create_user(
                username=f'prof{i}',
                email=f'prof{i}@test.com',
                password='pass123',
                first_name=f'Professor{i}',
                last_name=f'Test{i}'
            )
            user.profile.role = 'PROFESSOR'
            user.profile.save()

        regular_user = User.objects.create_user(
            username='regular',
            email='regular@test.com',
            password='pass123'
        )

        api_client.force_authenticate(user=regular_user)
        response = api_client.get('/api/professors/')
        assert response.status_code == 200
        assert len(response.data) >= 2

