import json

from django.contrib.auth import get_user_model
from django.test import TestCase

from .models import UserProfile


class RegistrationTests(TestCase):
    def test_api_register_logs_in_user(self):
        payload = {
            "username": "api_user",
            "email": "api_user@example.com",
            "password1": "super-secret-123",
            "password2": "super-secret-123",
            "phone_number": "3001234567",
            "program": "Ingeniería Industrial",
            "semester": 4,
        }

        response = self.client.post(
            "/api/register/",
            data=json.dumps(payload),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertTrue(data.get("ok"))
        self.assertIn("user", data)

        User = get_user_model()
        created_user = User.objects.get(username=payload["username"])
        self.assertEqual(str(created_user.pk), self.client.session.get("_auth_user_id"))
        self.assertEqual(created_user.email, payload["email"])

        profile = UserProfile.objects.get(user=created_user)
        self.assertEqual(profile.phone_number, payload["phone_number"])
        self.assertEqual(profile.program, payload["program"])
        self.assertEqual(profile.semester, payload["semester"])

        self.assertEqual(
            data["user"],
            {
                "id": created_user.id,
                "username": created_user.username,
                "email": created_user.email,
                "first_name": "",
                "last_name": "",
                "profile": {
                    "phone_number": payload["phone_number"],
                    "program": payload["program"],
                    "semester": payload["semester"],
                },
            },
        )

    def test_api_register_validates_phone_and_semester(self):
        payload = {
            "username": "api_user_invalid",
            "email": "api_user_invalid@example.com",
            "password1": "super-secret-123",
            "password2": "super-secret-123",
            "phone_number": "123",
            "program": "Ingeniería Industrial",
            "semester": 25,
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
