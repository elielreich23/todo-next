"""
WSGI config for taskero_backend project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "taskero_backend.settings")

# Apply Python 3.14 compatibility patch before getting the application
# The patch is auto-applied via __init__.py, but we import it here to ensure it's loaded
from taskero_backend import compat_patch  # noqa: F401, E402

application = get_wsgi_application()
