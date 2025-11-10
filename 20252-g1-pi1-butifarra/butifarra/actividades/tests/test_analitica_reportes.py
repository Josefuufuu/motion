"""
Tests for Analytics and Reports Dashboard
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
class TestReportsDashboard:
    """Test reports dashboard endpoint"""

    def test_admin_can_access_dashboard(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/reports/dashboard/')
        assert response.status_code == 200

    def test_non_admin_cannot_access_dashboard(self, api_client, beneficiary_user):
        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get('/api/reports/dashboard/')
        assert response.status_code == 403

    def test_unauthenticated_cannot_access_dashboard(self, api_client):
        response = api_client.get('/api/reports/dashboard/')
        assert response.status_code == 401

    def test_dashboard_with_activities_data(self, api_client, admin_user):
        # Create some activities
        for i in range(3):
            Activity.objects.create(
                title=f'Activity {i}',
                category='DEPORTE',
                start=timezone.now() + timedelta(days=i+1),
                end=timezone.now() + timedelta(days=i+2),
                capacity=20,
                created_by=admin_user
            )

        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/reports/dashboard/')
        assert response.status_code == 200

    def test_dashboard_with_date_filters(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        from_date = timezone.now().date().isoformat()
        to_date = (timezone.now().date() + timedelta(days=30)).isoformat()

        response = api_client.get(f'/api/reports/dashboard/?from={from_date}&to={to_date}')
        assert response.status_code == 200


@pytest.mark.django_db
class TestReportsAnalytics:
    """Test analytics calculations"""

    def test_activity_enrollment_analytics(self, api_client, admin_user, beneficiary_user):
        activity = Activity.objects.create(
            title='Analytics Activity',
            category='DEPORTE',
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=2),
            capacity=20,
            actual_attendees=10,
            created_by=admin_user
        )

        ActivityEnrollment.objects.create(user=beneficiary_user, activity=activity, attended=True)

        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/reports/dashboard/')
        assert response.status_code == 200

    def test_category_distribution_analytics(self, api_client, admin_user):
        # Create activities in different categories
        Activity.objects.create(
            title='Sport 1',
            category='DEPORTE',
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=2),
            capacity=20,
            created_by=admin_user
        )
        Activity.objects.create(
            title='Culture 1',
            category='CULTURA',
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=2),
            capacity=20,
            created_by=admin_user
        )

        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/reports/dashboard/')
        assert response.status_code == 200


@pytest.mark.django_db
class TestReportsFiltering:
    """Test report filtering options"""

    def test_filter_by_category(self, api_client, admin_user):
        Activity.objects.create(
            title='Sport Activity',
            category='DEPORTE',
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=2),
            capacity=20,
            created_by=admin_user
        )

        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/reports/dashboard/?category=DEPORTE')
        assert response.status_code == 200

    def test_filter_by_date_range(self, api_client, admin_user):
        Activity.objects.create(
            title='Date Activity',
            category='CULTURA',
            start=timezone.now() + timedelta(days=5),
            end=timezone.now() + timedelta(days=6),
            capacity=15,
            created_by=admin_user
        )

        api_client.force_authenticate(user=admin_user)
        from_date = timezone.now().date().isoformat()
        to_date = (timezone.now().date() + timedelta(days=10)).isoformat()
        response = api_client.get(f'/api/reports/dashboard/?from={from_date}&to={to_date}')
        assert response.status_code == 200

