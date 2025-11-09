import json

from django.contrib.auth import get_user_model
from django.test import TestCase

from .models import UserProfile


class RegistrationTests(TestCase):
    def setUp(self):
        self.User = get_user_model()
        self.admin = self.User.objects.create_user(
            username="admin_user",
            email="admin@example.com",
            password="strong-pass-123",
            is_staff=True,
        )
        self.admin.profile.role = "ADMIN"
        self.admin.profile.save()

        self.regular_user = self.User.objects.create_user(
            username="regular_user",
            email="regular@example.com",
            password="strong-pass-123",
        )

    def test_api_register_requires_authentication(self):
        payload = {
            "username": "api_user",
            "email": "api_user@example.com",
            "password1": "super-secret-123",
            "password2": "super-secret-123",
            "phone_number": "3001234567",
            "program": "Ingeniería Industrial",
            "semester": 4,
            "role": "BENEFICIARY",
        }

        response = self.client.post(
            "/api/register/",
            data=json.dumps(payload),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 401)
        self.assertFalse(response.json().get("ok", True))

    def test_api_register_requires_admin_privileges(self):
        self.client.force_login(self.regular_user)

        payload = {
            "username": "another_user",
            "email": "another_user@example.com",
            "password1": "super-secret-123",
            "password2": "super-secret-123",
            "phone_number": "3001234567",
            "program": "Ingeniería Industrial",
            "semester": 4,
            "role": "BENEFICIARY",
        }

        response = self.client.post(
            "/api/register/",
            data=json.dumps(payload),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertFalse(response.json().get("ok", True))

    def test_api_register_allows_admin_to_create_users_with_valid_roles(self):
        self.client.force_login(self.admin)

        for idx, role in enumerate(["BENEFICIARY", "PROFESSOR"], start=1):
            username = f"created_user_{idx}"
            payload = {
                "username": username,
                "email": f"{username}@example.com",
                "password1": "super-secret-123",
                "password2": "super-secret-123",
                "phone_number": "3001234567",
                "program": "Ingeniería Industrial",
                "semester": 4,
                "role": role,
            }

            response = self.client.post(
                "/api/register/",
                data=json.dumps(payload),
                content_type="application/json",
            )

            self.assertEqual(response.status_code, 201)

            data = response.json()
            self.assertTrue(data.get("ok"))
            self.assertIn("user", data)
            self.assertEqual(data["user"]["profile"]["role"], role)
            self.assertEqual(data["user"]["profile"]["phone_number"], payload["phone_number"])
            self.assertEqual(data["user"]["profile"]["program"], payload["program"])
            self.assertEqual(data["user"]["profile"]["semester"], payload["semester"])

            created_user = self.User.objects.get(username=username)
            created_profile = UserProfile.objects.get(user=created_user)

            self.assertEqual(created_profile.role, role)
            self.assertEqual(created_profile.phone_number, payload["phone_number"])
            self.assertEqual(created_profile.program, payload["program"])
            self.assertEqual(created_profile.semester, payload["semester"])

            # Ensure the admin session remains active
            self.assertEqual(str(self.admin.pk), self.client.session.get("_auth_user_id"))

    def test_api_register_validates_phone_and_semester(self):
        self.client.force_login(self.admin)

        payload = {
            "username": "api_user_invalid",
            "email": "api_user_invalid@example.com",
            "password1": "super-secret-123",
            "password2": "super-secret-123",
            "phone_number": "123",
            "program": "Ingeniería Industrial",
            "semester": 25,
            "role": "BENEFICIARY",
        }

        response = self.client.post(
            "/api/register/",
            data=json.dumps(payload),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

        data = response.json()
        self.assertFalse(data.get("ok", True))
        self.assertIn("phone_number", data["errors"])
        self.assertIn("semester", data["errors"])
