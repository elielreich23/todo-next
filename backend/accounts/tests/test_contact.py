from django.core import mail
from django.core.cache import cache
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    CONTACT_EMAIL="team@tasker.test",
)
class TestContactMessageAPI(APITestCase):
    def setUp(self):
        cache.clear()

    def tearDown(self):
        cache.clear()

    def test_contact_message_requires_valid_email(self):
        response = self.client.post(
            "/api/auth/contact/",
            {
                "full_name": "Ada Lovelace",
                "email": "not-an-email",
                "organization": "Student Builders",
                "message": "We want to try Tasker for our capstone.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertIn("email", response.data["errors"])
        self.assertEqual(len(mail.outbox), 0)

    def test_contact_message_sends_email(self):
        response = self.client.post(
            "/api/auth/contact/",
            {
                "full_name": "Ada Lovelace",
                "email": "Ada.Team+tasker@gmail.com",
                "organization": "Student Builders",
                "message": "We want to try Tasker for our capstone.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["team@tasker.test"])
        self.assertIn("adateam@gmail.com", mail.outbox[0].body)
        self.assertIn("Student Builders", mail.outbox[0].body)

    def test_contact_message_is_throttled(self):
        payload = {
            "full_name": "Ada Lovelace",
            "email": "ada@example.com",
            "organization": "Student Builders",
            "message": "We want to try Tasker for our capstone.",
        }

        for _ in range(5):
            response = self.client.post("/api/auth/contact/", payload, format="json")
            self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.post("/api/auth/contact/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
