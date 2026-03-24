from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from projects.models import Project, Task


class TestProjectTaskSqlInjectionSafety(APITestCase):
    def setUp(self):
        self.password = "SecurePass123!"
        self.user = User.objects.create_user(
            username="owner",
            email="owner@example.com",
            full_name="Owner User",
            password=self.password,
        )
        self.project = Project.objects.create(name="Safe Project", owner=self.user)
        Task.objects.create(
            title="Task 1",
            project=self.project,
            owner=self.user,
        )

        signin = self.client.post(
            "/api/auth/signin/",
            {"email": self.user.email, "password": self.password},
            format="json",
        )
        self.assertEqual(signin.status_code, status.HTTP_200_OK)
        access = signin.data["tokens"]["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

    def test_task_list_rejects_injection_in_project_id(self):
        resp = self.client.get("/api/tasks/?projectId=1 OR 1=1 --")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(resp.data.get("success", False))

    def test_task_list_allows_valid_project_id(self):
        resp = self.client.get(f"/api/tasks/?projectId={self.project.id}")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data.get("success"))
        self.assertEqual(len(resp.data.get("tasks", [])), 1)
