"""
Tests for CSRF token handling
"""
import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from actividades.models import UserProfile


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
class TestCSRFTokens:
    """Test CSRF token functionality"""

    def test_session_endpoint_provides_csrf_token(self, api_client):
        user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='test123'
        )
        api_client.force_authenticate(user=user)

        response = api_client.get('/api/session/')
        assert response.status_code == 200
        assert response.data['ok'] is True

    def test_login_provides_csrf_token(self, api_client):
        User.objects.create_user(
            username='loginuser',
            email='login@test.com',
            password='login123'
        )

        data = {'username': 'loginuser', 'password': 'login123'}
        response = api_client.post('/api/login/', data, format='json')
        assert response.status_code == 200

    def test_unauthenticated_session_request(self, api_client):
        response = api_client.get('/api/session/')
        assert response.status_code == 401

