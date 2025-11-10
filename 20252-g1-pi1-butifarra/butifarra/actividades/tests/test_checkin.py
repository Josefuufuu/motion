import pytest
from django.contrib.auth.models import User
from butifarra.actividades.models import UserProfile

@pytest.fixture
def professor_user(db):
    u = User.objects.create_user(username='professor1', password='x')
    # Asegura el perfil con rol PROFESOR
    UserProfile.objects.update_or_create(
        user=u,
        defaults={
            "role": "PROFESSOR",
            "phone_number": "3000000000",
            "program": "Artes",
            "semester": 1,
        },
    )
    return u

@pytest.fixture
def student_user(db):
    u = User.objects.create_user(username='student1', password='x')
    UserProfile.objects.update_or_create(
        user=u,
        defaults={
            "role": "BENEFICIARY",
            "phone_number": "3000000001",
            "program": "Artes",
            "semester": 1,
        },
    )
    return u

@pytest.fixture
def admin_user(db):
    # basta con staff/superuser para crear actividades
    return User.objects.create_user(username='admin', password='x', is_staff=True)

