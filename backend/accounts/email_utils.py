"""
Email helpers for account identity.
"""

GMAIL_DOMAINS = {"gmail.com", "googlemail.com"}


def normalize_account_email(email: str) -> str:
    """
    Normalize account emails before lookup/storage.

    Gmail treats dots and plus tags in the local part as aliases for the same
    mailbox, so normalize those forms to avoid duplicate Taskero accounts for
    the same Gmail inbox.
    """
    if not email:
        return email

    local_part, separator, domain = email.strip().lower().partition("@")
    if not separator:
        return email.strip().lower()

    if domain in GMAIL_DOMAINS:
        local_part = local_part.split("+", 1)[0].replace(".", "")
        domain = "gmail.com"

    return f"{local_part}@{domain}"
