"""
Google OAuth authentication utilities.
"""

import logging
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

try:
    from google.auth.transport import requests as google_requests
    from google.oauth2 import id_token

    GOOGLE_AUTH_AVAILABLE = True
except ImportError:
    GOOGLE_AUTH_AVAILABLE = False
    logger.warning("google-auth not installed. Google OAuth will not work.")


def verify_google_token(token: str, client_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Verify Google ID token and return user info.

    Args:
        token: Google ID token from frontend
        client_id: Optional Google OAuth client ID for verification

    Returns:
        dict with user info (email, name, sub) if valid, None otherwise
    """
    if not GOOGLE_AUTH_AVAILABLE:
        logger.error("Google auth not available - google-auth package not installed")
        return None

    try:
        # Use client_id from settings if available, otherwise verify without it
        if not client_id:
            from django.conf import settings

            client_id = getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", None)

        if client_id:
            # Verify with client ID (more secure)
            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                client_id,
            )
        else:
            # Verify without client ID (less secure, but works for development)
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), skip_issued_at_check=True)

            # Verify the issuer
            if idinfo.get("iss") not in ["accounts.google.com", "https://accounts.google.com"]:
                logger.warning(f"Invalid token issuer: {idinfo.get('iss')}")
                return None

        return {
            "email": idinfo.get("email"),
            "email_verified": idinfo.get("email_verified", False),
            "name": idinfo.get("name", ""),
            "given_name": idinfo.get("given_name", ""),
            "family_name": idinfo.get("family_name", ""),
            "picture": idinfo.get("picture", ""),
            "sub": idinfo.get("sub"),  # Google user ID
        }
    except ValueError as e:
        logger.error(f"Invalid Google token: {e}")
        return None
    except Exception as e:
        logger.error(f"Error verifying Google token: {e}", exc_info=True)
        return None


def verify_google_token_with_client_id(token: str, client_id: str) -> Optional[Dict[str, Any]]:
    """
    Verify Google ID token with client ID check (more secure).

    Args:
        token: Google ID token from frontend
        client_id: Your Google OAuth client ID

    Returns:
        dict with user info if valid, None otherwise
    """
    if not GOOGLE_AUTH_AVAILABLE:
        logger.error("Google auth not available - google-auth package not installed")
        return None

    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            client_id,
        )

        return {
            "email": idinfo.get("email"),
            "email_verified": idinfo.get("email_verified", False),
            "name": idinfo.get("name", ""),
            "given_name": idinfo.get("given_name", ""),
            "family_name": idinfo.get("family_name", ""),
            "picture": idinfo.get("picture", ""),
            "sub": idinfo.get("sub"),
        }
    except ValueError as e:
        logger.error(f"Invalid Google token: {e}")
        return None
    except Exception as e:
        logger.error(f"Error verifying Google token: {e}", exc_info=True)
        return None
