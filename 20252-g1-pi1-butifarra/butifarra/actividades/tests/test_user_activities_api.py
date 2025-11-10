"""
Tests for User Activities API
"""
import pytest
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from actividades.models import Activity, Tournament, ActivityEnrollment, TournamentEnrollment, UserProfile


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
class TestUserActivitiesAPI:
    """Test user activities endpoint"""

    def test_get_user_activities_empty(self, api_client, beneficiary_user):
        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get('/api/user/activities')
        assert response.status_code == 200
        assert 'activities' in response.data
        assert 'tournaments' in response.data

    def test_get_user_activities_with_enrollments(self, api_client, admin_user, beneficiary_user):
        # Create activity and enroll
        activity = Activity.objects.create(
            title='User Activity',
            category='DEPORTE',
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=2),
            capacity=20,
            created_by=admin_user
        )
        ActivityEnrollment.objects.create(user=beneficiary_user, activity=activity)

        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get('/api/user/activities')
        assert response.status_code == 200
        assert len(response.data['activities']) >= 1

    def test_get_user_tournaments_with_enrollments(self, api_client, admin_user, beneficiary_user):
        # Create tournament and enroll
        tournament = Tournament.objects.create(
            name='User Tournament',
            sport='Tennis',
            start=timezone.now() + timedelta(days=5),
            end=timezone.now() + timedelta(days=7),
            max_teams=8,
            created_by=admin_user
        )
        TournamentEnrollment.objects.create(user=beneficiary_user, tournament=tournament)

        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get('/api/user/activities')
        assert response.status_code == 200
        assert len(response.data['tournaments']) >= 1

    def test_user_activities_unauthenticated(self, api_client):
        response = api_client.get('/api/user/activities')
        assert response.status_code == 401

    def test_user_activities_includes_future_events(self, api_client, admin_user, beneficiary_user):
        # Create future activity
        future_activity = Activity.objects.create(
            title='Future Activity',
            category='CULTURA',
            start=timezone.now() + timedelta(days=10),
            end=timezone.now() + timedelta(days=11),
            capacity=15,
            created_by=admin_user
        )
        ActivityEnrollment.objects.create(user=beneficiary_user, activity=future_activity)

        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get('/api/user/activities')
        assert response.status_code == 200
        activities = response.data['activities']
        assert any(a['title'] == 'Future Activity' for a in activities)

    def test_user_activities_only_shows_own_enrollments(self, api_client, admin_user, beneficiary_user):
        # Create another user
        other_user = User.objects.create_user(
            username='other',
            email='other@test.com',
            password='pass123'
        )

        # Create activities
        activity1 = Activity.objects.create(
            title='My Activity',
            category='DEPORTE',
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=2),
            capacity=20,
            created_by=admin_user
        )
        activity2 = Activity.objects.create(
            title='Other Activity',
            category='CULTURA',
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=2),
            capacity=20,
            created_by=admin_user
        )

        # Enroll different users
        ActivityEnrollment.objects.create(user=beneficiary_user, activity=activity1)
        ActivityEnrollment.objects.create(user=other_user, activity=activity2)

        # Check beneficiary user only sees their activity
        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get('/api/user/activities')
        assert response.status_code == 200
        activities = response.data['activities']
        assert any(a['title'] == 'My Activity' for a in activities)
        assert not any(a['title'] == 'Other Activity' for a in activities)

