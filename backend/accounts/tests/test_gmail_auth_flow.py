from django.core import mail
from django.core.cache import cache
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User


class TestGmailAuthFlow(APITestCase):
    def setUp(self):
        cache.clear()

    def tearDown(self):
        cache.clear()

    def test_signup_normalizes_gmail_aliases_and_blocks_duplicates(self):
        password = "SecurePass123!"
        first = self.client.post(
            "/api/auth/signup/",
            {
                "username": "janedoe",
                "email": "Jane.Doe+taskero@googlemail.com",
                "full_name": "Jane Doe",
                "password": password,
                "password_confirm": password,
            },
            format="json",
        )

        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(first.data["user"]["email"], "janedoe@gmail.com")

        duplicate = self.client.post(
            "/api/auth/signup/",
            {
                "username": "janeother",
                "email": "janedoe@gmail.com",
                "full_name": "Jane Other",
                "password": password,
                "password_confirm": password,
            },
            format="json",
        )

        self.assertEqual(duplicate.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(User.objects.filter(email="janedoe@gmail.com").count(), 1)

    def test_signin_accepts_normalized_gmail_alias(self):
        password = "SecurePass123!"
        User.objects.create_user(
            username="janedoe",
            email="janedoe@gmail.com",
            full_name="Jane Doe",
            password=password,
        )

        response = self.client.post(
            "/api/auth/signin/",
            {"email": "jane.doe+mobile@googlemail.com", "password": password},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
        FRONTEND_URL="https://taskero.example",
        PASSWORD_RESET_DEBUG_TOKENS=False,
    )
    def test_password_reset_sends_email_without_exposing_token(self):
        User.objects.create_user(
            username="janedoe",
            email="janedoe@gmail.com",
            full_name="Jane Doe",
            password="SecurePass123!",
        )

        response = self.client.post(
            "/api/auth/password/reset/request/",
            {"email": "jane.doe+reset@gmail.com"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertIsNone(response.data["token"])
        self.assertIsNone(response.data["uid"])
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["janedoe@gmail.com"])
        self.assertIn("https://taskero.example/auth/forgetPwd_1?token=", mail.outbox[0].body)
