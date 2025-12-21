"""
Utility functions for device fingerprinting and information extraction
"""

import re
from typing import Dict, Optional


def parse_user_agent(user_agent: str) -> Dict[str, str]:
    """
    Parse user agent string to extract browser and OS information

    Args:
        user_agent: User agent string from request

    Returns:
        Dictionary with browser, os, and device_name
    """
    if not user_agent:
        return {"browser": "Unknown", "os": "Unknown", "device_name": "Unknown Device"}

    browser = "Unknown"
    os_name = "Unknown"
    device_name = "Unknown Device"

    # Browser detection
    if "Chrome" in user_agent and "Edg" not in user_agent:
        browser = "Chrome"
        version_match = re.search(r"Chrome/(\d+)", user_agent)
        if version_match:
            browser = f"Chrome {version_match.group(1)}"
    elif "Firefox" in user_agent:
        browser = "Firefox"
        version_match = re.search(r"Firefox/(\d+)", user_agent)
        if version_match:
            browser = f"Firefox {version_match.group(1)}"
    elif "Safari" in user_agent and "Chrome" not in user_agent:
        browser = "Safari"
        version_match = re.search(r"Version/(\d+)", user_agent)
        if version_match:
            browser = f"Safari {version_match.group(1)}"
    elif "Edg" in user_agent:
        browser = "Edge"
        version_match = re.search(r"Edg/(\d+)", user_agent)
        if version_match:
            browser = f"Edge {version_match.group(1)}"
    elif "Opera" in user_agent or "OPR" in user_agent:
        browser = "Opera"
        version_match = re.search(r"(?:Opera|OPR)/(\d+)", user_agent)
        if version_match:
            browser = f"Opera {version_match.group(1)}"

    # OS detection
    if "Windows" in user_agent:
        os_name = "Windows"
        if "Windows NT 10.0" in user_agent:
            os_name = "Windows 10/11"
        elif "Windows NT 6.3" in user_agent:
            os_name = "Windows 8.1"
        elif "Windows NT 6.2" in user_agent:
            os_name = "Windows 8"
        elif "Windows NT 6.1" in user_agent:
            os_name = "Windows 7"
    elif "Mac OS X" in user_agent or "Macintosh" in user_agent:
        os_name = "macOS"
        version_match = re.search(r"Mac OS X (\d+)[._](\d+)", user_agent)
        if version_match:
            os_name = f"macOS {version_match.group(1)}.{version_match.group(2)}"
    elif "Linux" in user_agent:
        os_name = "Linux"
        if "Ubuntu" in user_agent:
            os_name = "Ubuntu"
        elif "Android" in user_agent:
            os_name = "Android"
            version_match = re.search(r"Android (\d+(?:\.\d+)?)", user_agent)
            if version_match:
                os_name = f"Android {version_match.group(1)}"
    elif "iPhone" in user_agent or "iPad" in user_agent:
        os_name = "iOS"
        version_match = re.search(r"OS (\d+)[._](\d+)", user_agent)
        if version_match:
            os_name = f"iOS {version_match.group(1)}.{version_match.group(2)}"
        if "iPad" in user_agent:
            device_name = "iPad"
        elif "iPhone" in user_agent:
            device_name = "iPhone"

    # Device name generation
    if device_name == "Unknown Device":
        if "Mobile" in user_agent or "Android" in user_agent:
            device_name = f"{os_name} Mobile"
        elif "Tablet" in user_agent or "iPad" in user_agent:
            device_name = f"{os_name} Tablet"
        else:
            device_name = f"{os_name} Desktop"

    return {
        "browser": browser,
        "os": os_name,
        "device_name": device_name,
    }


def get_client_ip(request) -> Optional[str]:
    """
    Get client IP address from request

    Args:
        request: Django request object

    Returns:
        IP address string or None
    """
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0].strip()
    else:
        ip = request.META.get("REMOTE_ADDR")
    return ip


def get_location_from_ip(ip_address: Optional[str]) -> str:
    """
    Get location information from IP address
    Note: This is a placeholder. In production, use a service like GeoIP2 or ipapi.co

    Args:
        ip_address: IP address string

    Returns:
        Location string (e.g., "New York, US")
    """
    if not ip_address:
        return "Unknown"

    # Skip private/local IPs
    if ip_address.startswith(("127.", "192.168.", "10.", "172.")):
        return "Local Network"

    # TODO: Integrate with GeoIP service in production
    # For now, return a placeholder
    return "Location Unknown"
