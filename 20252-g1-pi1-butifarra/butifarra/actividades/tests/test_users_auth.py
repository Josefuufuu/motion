import pytest
from django.contrib.auth.models import User
from django.test import Client, TestCase


pytestmark = pytest.mark.django_db


class UserRoleTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_student_role_profile_created_automatically(self):
        student = User.objects.create_user(username="student_user", password="testpass123")

        profile = student.profile

        self.assertEqual(profile.role, "BENEFICIARY")
        self.assertTrue(profile.is_beneficiary)
        self.assertFalse(profile.is_professor)
        self.assertFalse(profile.is_admin)

    def test_professor_role_profile_login(self):
        professor = User.objects.create_user(username="professor_user", password="testpass123")
        profile = professor.profile
        profile.role = "PROFESSOR"
        profile.save()

        self.assertTrue(self.client.login(username="professor_user", password="testpass123"))

        profile.refresh_from_db()
        self.assertEqual(profile.role, "PROFESSOR")
        self.assertTrue(profile.is_professor)
        self.assertFalse(profile.is_beneficiary)
        self.assertFalse(profile.is_admin)

    def test_admin_role_profile_flags(self):
        admin = User.objects.create_user(
            username="admin_user",
            password="testpass123",
            is_staff=True,
            is_superuser=True,
        )
        profile = admin.profile
        profile.role = "ADMIN"
        profile.save()

        self.assertTrue(self.client.login(username="admin_user", password="testpass123"))

        profile.refresh_from_db()
        self.assertEqual(profile.role, "ADMIN")
        self.assertTrue(profile.is_admin)
        self.assertFalse(profile.is_beneficiary)
        self.assertFalse(profile.is_professor)
