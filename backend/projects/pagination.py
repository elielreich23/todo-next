"""
Centralized pagination classes for consistent pagination across the API
"""

from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """Standard pagination with configurable page size"""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class ProjectPagination(PageNumberPagination):
    """Pagination for project lists"""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class TaskPagination(PageNumberPagination):
    """Pagination for task lists"""

    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 200


class UserPagination(PageNumberPagination):
    """Pagination for user lists"""

    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 100


class NotificationPagination(PageNumberPagination):
    """Pagination for notification lists"""

    page_size = 30
    page_size_query_param = "page_size"
    max_page_size = 100


class CommentPagination(PageNumberPagination):
    """Pagination for comment lists"""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class AttachmentPagination(PageNumberPagination):
    """Pagination for attachment lists"""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100
