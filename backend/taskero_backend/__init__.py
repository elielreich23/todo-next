"""
Django project initialization.
Applies compatibility patches for Python 3.14.
"""

# This import applies the patch when Django loads
try:
    from . import compat_patch  # noqa: F401
except ImportError:
    pass
