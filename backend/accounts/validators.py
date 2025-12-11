"""
Custom password validators for enhanced password strength validation.
"""

import zxcvbn
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class ZxcvbnPasswordValidator:
    """
    Password validator using the zxcvbn algorithm for realistic password strength estimation.

    This validator checks password strength and provides detailed feedback.
    Minimum score is 2 out of 4 (0=too guessable, 1=very guessable, 2=somewhat guessable,
    3=somewhat safe, 4=very safe).
    """

    def __init__(self, min_score=2):
        """
        Initialize the validator.

        Django passes OPTIONS as keyword arguments, so min_score will be
        the value from OPTIONS['min_score'] if specified, otherwise default is 2.

        Args:
            min_score: Minimum zxcvbn score required (0-4). Default is 2.
        """
        self.min_score = min_score

    def validate(self, password, user=None):
        """
        Validate password strength using zxcvbn.

        Args:
            password: The password to validate
            user: The user object (if available) to check against user attributes
        """
        # Collect user inputs if user is provided
        user_inputs = []
        if user:
            # Add user attributes that shouldn't be in password
            if hasattr(user, "email"):
                user_inputs.append(user.email.split("@")[0])  # Local part of email
            if hasattr(user, "username"):
                user_inputs.append(user.username)
            if hasattr(user, "full_name"):
                # Split full name into parts
                user_inputs.extend(user.full_name.lower().split())

        # Calculate password strength
        result = zxcvbn.zxcvbn(password, user_inputs=user_inputs)
        score = result["score"]
        feedback = result.get("feedback", {})

        # Check if password meets minimum score
        if score < self.min_score:
            # Build error message from feedback
            suggestions = feedback.get("suggestions", [])
            warning = feedback.get("warning", "")

            error_messages = []
            if warning:
                error_messages.append(warning)

            if suggestions:
                error_messages.extend(suggestions[:2])  # Limit to first 2 suggestions

            if not error_messages:
                # Fallback messages based on score
                if score == 0:
                    error_messages.append("Password is too weak. It's very guessable.")
                elif score == 1:
                    error_messages.append("Password is too weak. It's easily guessable.")

            raise ValidationError(
                " ".join(error_messages) if error_messages else "Password is too weak. Please choose a stronger password."
            )

    def get_help_text(self):
        """Return help text for the validator."""
        return _(
            "Your password must be strong enough to resist common attacks. "
            "Avoid using personal information, common words, or simple patterns."
        )


def get_password_strength(password, user_inputs=None):
    """
    Get password strength information for API responses.

    Args:
        password: The password to analyze
        user_inputs: List of user-specific inputs to avoid

    Returns:
        dict: Password strength information including score, feedback, and estimated crack time
    """
    result = zxcvbn.zxcvbn(password, user_inputs=user_inputs or [])

    # Map score to labels
    score_labels = {0: "too_weak", 1: "weak", 2: "fair", 3: "good", 4: "strong"}

    return {
        "score": result["score"],
        "label": score_labels.get(result["score"], "unknown"),
        "crack_times_display": result.get("crack_times_display", {}),
        "feedback": {
            "warning": result.get("feedback", {}).get("warning", ""),
            "suggestions": result.get("feedback", {}).get("suggestions", []),
        },
        "guesses": result.get("guesses", 0),
        "guesses_log10": result.get("guesses_log10", 0),
    }
