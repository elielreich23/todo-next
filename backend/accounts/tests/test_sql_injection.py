from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User


class TestAuthSqlInjectionSafety(APITestCase):
    def setUp(self):
        self.password = "SecurePass123!"
        self.user = User.objects.create_user(
            username="owner",
            email="owner@example.com",
            full_name="Owner User",
            password=self.password,
        )

    def _authenticate(self):
        resp = self.client.post(
            "/api/auth/signin/",
            {"email": "owner@example.com", "password": self.password},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        access = resp.data["tokens"]["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

    def test_signin_rejects_sql_injection_payload(self):
        resp = self.client.post(
            "/api/auth/signin/",
            {
                "email": "owner@example.com' OR 1=1 --",
                "password": "anything' OR 'x'='x",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(resp.data.get("success", False))

    def test_user_search_does_not_bypass_filters_with_injection_string(self):
        User.objects.create_user(
            username="alice",
            email="alice@example.com",
            full_name="Alice A",
            password="SecurePass123!",
        )
        User.objects.create_user(
            username="bob",
            email="bob@example.com",
            full_name="Bob B",
            password="SecurePass123!",
        )

        self._authenticate()

        resp = self.client.get("/api/auth/users/search/?q=' OR 1=1 --")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data.get("success"))
        self.assertEqual(resp.data.get("users"), [])
