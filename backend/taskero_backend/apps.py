"""
AppConfig for the main project.
Applies Python 3.14 compatibility patches.
"""

from django.apps import AppConfig


class TaskeroBackendConfig(AppConfig):
    name = "taskero_backend"

    def ready(self):
        """Apply compatibility patches when Django is ready."""
        from . import compat_patch  # noqa: F401
