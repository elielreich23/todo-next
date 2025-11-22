"""
WSGI config for taskero_backend project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "taskero_backend.settings")

# Apply Python 3.14 compatibility patch before getting the application
from taskero_backend import compat_patch

application = get_wsgi_application()
