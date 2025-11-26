#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "taskero_backend.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc

    # Apply Python 3.14 compatibility patch after Django imports but before running commands
    import django  # noqa: F401

    if not django.apps.apps.ready:
        django.setup()
    from taskero_backend import compat_patch  # noqa: F401, E402

    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
