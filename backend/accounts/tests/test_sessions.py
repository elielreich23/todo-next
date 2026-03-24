import secrets
from datetime import timedelta

from django.db import connection
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import UserSession


class TestUserSessionsAPI(APITestCase):
    def _signup_and_get_access(self, email="john@example.com", password=None):
        password = password or secrets.token_urlsafe(24)
        resp = self.client.post(
            "/api/auth/signup/",
            {
                "username": "johndoe",
                "email": email,
                "full_name": "John Doe",
                "password": password,
                "password_confirm": password,
            },
            format="json",
            HTTP_USER_AGENT=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(resp.data.get("success"))
        tokens = resp.data.get("tokens") or {}
        access = tokens.get("access")
        self.assertTrue(access)
        return access

    def _auth(self, access_token):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

    def test_session_created_on_signup_and_listable(self):
        access = self._signup_and_get_access()
        self._auth(access)

        resp = self.client.get("/api/auth/sessions/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data.get("success"))

        sessions = resp.data.get("sessions") or []
        self.assertEqual(len(sessions), 1)
        s0 = sessions[0]
        self.assertTrue(s0.get("is_current"))
        self.assertIn("Windows", s0.get("os", ""))
        self.assertIn("Chrome", s0.get("browser", ""))
        self.assertTrue(s0.get("device_name"))

        self.assertEqual(UserSession.objects.filter(revoked=False).count(), 1)

    def test_sensitive_session_fields_are_encrypted_at_rest(self):
        self._signup_and_get_access()
        session = UserSession.objects.filter(revoked=False).first()
        self.assertIsNotNone(session)

        # Read raw ciphertext from DB and ensure it doesn't match plaintext.
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT ip_address, location, user_agent FROM accounts_usersession WHERE user_id = %s ORDER BY created_at DESC LIMIT 1",
                [session.user_id],
            )
            row = cursor.fetchone()

        self.assertIsNotNone(row)
        raw_ip, raw_location, raw_user_agent = row
        self.assertNotEqual(raw_ip, "127.0.0.1")
        self.assertNotEqual(raw_location, "Local Network")
        self.assertNotIn("Mozilla", raw_user_agent or "")

    def test_revoke_single_session_removes_from_active_list(self):
        email = "john@example.com"
        password = "SecurePass123!"
        access = self._signup_and_get_access(email=email, password=password)
        self._auth(access)

        # Create a second session by signing in again (marks previous non-current)
        signin_resp = self.client.post(
            "/api/auth/signin/",
            {"email": email, "password": password},
            format="json",
            HTTP_USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Safari/605.1.15",
        )
        self.assertEqual(signin_resp.status_code, status.HTTP_200_OK)
        access2 = (signin_resp.data.get("tokens") or {}).get("access")
        self.assertTrue(access2)
        self._auth(access2)

        list_resp = self.client.get("/api/auth/sessions/")
        sessions = list_resp.data.get("sessions") or []
        self.assertEqual(len(sessions), 2)

        # Revoke a non-current session
        other = next(s for s in sessions if not s.get("is_current"))
        revoke_resp = self.client.post("/api/auth/sessions/revoke/", {"session_id": other["id"]}, format="json")
        self.assertEqual(revoke_resp.status_code, status.HTTP_200_OK)
        self.assertTrue(revoke_resp.data.get("success"))

        list_resp2 = self.client.get("/api/auth/sessions/")
        sessions2 = list_resp2.data.get("sessions") or []
        self.assertEqual(len(sessions2), 1)
        self.assertTrue(sessions2[0].get("is_current"))

        s = UserSession.objects.get(id=other["id"])
        self.assertTrue(s.revoked)
        self.assertIsNotNone(s.revoked_at)

    def test_revoke_all_excludes_current_when_requested(self):
        email = "john@example.com"
        password = "SecurePass123!"
        access = self._signup_and_get_access(email=email, password=password)
        self._auth(access)

        # Create a second session by signing in again (marks previous non-current)
        signin_resp = self.client.post(
            "/api/auth/signin/",
            {"email": email, "password": password},
            format="json",
            HTTP_USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Safari/605.1.15",
        )
        self.assertEqual(signin_resp.status_code, status.HTTP_200_OK)
        self.assertTrue(signin_resp.data.get("success"))
        access2 = (signin_resp.data.get("tokens") or {}).get("access")
        self.assertTrue(access2)
        self._auth(access2)

        list_resp = self.client.get("/api/auth/sessions/")
        sessions = list_resp.data.get("sessions") or []
        self.assertEqual(len(sessions), 2)
        self.assertEqual(len([s for s in sessions if s.get("is_current")]), 1)

        revoke_all_resp = self.client.post(
            "/api/auth/sessions/revoke-all/",
            {"exclude_current": True},
            format="json",
        )
        self.assertEqual(revoke_all_resp.status_code, status.HTTP_200_OK)
        self.assertTrue(revoke_all_resp.data.get("success"))

        list_resp2 = self.client.get("/api/auth/sessions/")
        sessions2 = list_resp2.data.get("sessions") or []
        self.assertEqual(len(sessions2), 1)
        self.assertTrue(sessions2[0].get("is_current"))
        self.assertEqual(UserSession.objects.filter(revoked=False).count(), 1)
        self.assertEqual(UserSession.objects.filter(revoked=True).count(), 1)

    def test_inactivity_timeout_revokes_current_session_and_blocks_requests(self):
        access = self._signup_and_get_access()
        self._auth(access)

        current = UserSession.objects.filter(is_current=True, revoked=False).first()
        self.assertIsNotNone(current)

        # Force last_activity beyond the 15-minute inactivity timeout
        UserSession.objects.filter(id=current.id).update(last_activity=timezone.now() - timedelta(minutes=16))

        # Any authenticated request should now fail and revoke the session
        resp = self.client.get("/api/auth/profile/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

        current.refresh_from_db()
        self.assertTrue(current.revoked)
