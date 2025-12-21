"""
Custom exception handler for DRF to format errors consistently.
"""

import logging
import traceback

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def rate_limit_handler(exc, context):
    """
    Custom exception handler for DRF.
    Formats all errors to match our API response format.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    # If DRF handler didn't handle it, return a generic error response
    if response is None:
        # This handles non-DRF exceptions
        logger.error(f"Unhandled exception: {exc}\n{traceback.format_exc()}")
        return Response(
            {
                "success": False,
                "message": "An error occurred processing your request.",
                "error": str(exc) if hasattr(exc, "__str__") else "Unknown error",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Format DRF response to match our API format
    if hasattr(response, "data") and isinstance(response.data, dict):
        if "success" not in response.data:
            response.data["success"] = False
        # Handle throttle exceptions (429)
        if response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
            response.data.update(
                {
                    "message": "Too many requests. Please try again later.",
                    "error": "rate_limit_exceeded",
                    "detail": response.data.get(
                        "detail", "You have exceeded the maximum number of requests. Please wait a moment before trying again."
                    ),
                }
            )

    return response
