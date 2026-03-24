import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.db import models


def _get_fernet() -> Fernet:
    raw_key = getattr(settings, "FIELD_ENCRYPTION_KEY", "").strip()
    if raw_key:
        key_bytes = raw_key.encode("utf-8")
    else:
        digest = hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest()
        key_bytes = base64.urlsafe_b64encode(digest)
    return Fernet(key_bytes)


class EncryptedTextField(models.TextField):
    """
    Encrypt/decrypt text values transparently for at-rest protection.
    """

    description = "Encrypted text field"

    def get_prep_value(self, value):
        value = super().get_prep_value(value)
        if value in (None, ""):
            return value
        token = _get_fernet().encrypt(str(value).encode("utf-8"))
        return token.decode("utf-8")

    def from_db_value(self, value, expression, connection):
        if value in (None, ""):
            return value
        try:
            decrypted = _get_fernet().decrypt(value.encode("utf-8"))
            return decrypted.decode("utf-8")
        except (InvalidToken, AttributeError, TypeError, ValueError):
            # Backward-compatible fallback for legacy/plain values.
            return value

    def to_python(self, value):
        if value in (None, "") or not isinstance(value, str):
            return value
        try:
            decrypted = _get_fernet().decrypt(value.encode("utf-8"))
            return decrypted.decode("utf-8")
        except (InvalidToken, ValueError):
            return value
