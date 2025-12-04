"""
WSGI config for taskero_backend project.
"""

import os

from django.core.wsgi import get_wsgi_application  # type: ignore[import]

from taskero_backend import compat_patch  # noqa: F401, E402

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "taskero_backend.settings")

application = get_wsgi_application()
