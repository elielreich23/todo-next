"""
Redis caching utilities for frequently accessed data
"""

import json
import logging
from typing import Optional

from django.core.cache import cache

logger = logging.getLogger(__name__)

# Cache timeouts (in seconds)
CACHE_TIMEOUTS = {
    "project_list": 300,  # 5 minutes
    "project_detail": 600,  # 10 minutes
    "task_list": 300,  # 5 minutes
    "task_detail": 600,  # 10 minutes
    "user_list": 600,  # 10 minutes
    "statistics": 300,  # 5 minutes
    "comments": 180,  # 3 minutes
    "attachments": 300,  # 5 minutes
}


def get_cache_key(prefix: str, user_id: int, *args) -> str:
    """Generate a cache key"""
    key_parts = [prefix, str(user_id)] + [str(arg) for arg in args]
    return ":".join(key_parts)


def cache_project_list(user_id: int, projects_data: list) -> None:
    """Cache project list for a user"""
    cache_key = get_cache_key("project_list", user_id)
    try:
        cache.set(cache_key, json.dumps(projects_data), CACHE_TIMEOUTS["project_list"])
    except Exception as e:
        logger.error(f"Error caching project list: {e}")


def get_cached_project_list(user_id: int) -> Optional[list]:
    """Get cached project list for a user"""
    cache_key = get_cache_key("project_list", user_id)
    try:
        cached_data = cache.get(cache_key)
        if cached_data:
            return json.loads(cached_data)
    except Exception as e:
        logger.error(f"Error retrieving cached project list: {e}")
    return None


def cache_project_detail(user_id: int, project_id: int, project_data: dict) -> None:
    """Cache project detail"""
    cache_key = get_cache_key("project_detail", user_id, project_id)
    try:
        cache.set(cache_key, json.dumps(project_data), CACHE_TIMEOUTS["project_detail"])
    except Exception as e:
        logger.error(f"Error caching project detail: {e}")


def get_cached_project_detail(user_id: int, project_id: int) -> Optional[dict]:
    """Get cached project detail"""
    cache_key = get_cache_key("project_detail", user_id, project_id)
    try:
        cached_data = cache.get(cache_key)
        if cached_data:
            return json.loads(cached_data)
    except Exception as e:
        logger.error(f"Error retrieving cached project detail: {e}")
    return None


def cache_task_list(user_id: int, project_id: Optional[int], tasks_data: list) -> None:
    """Cache task list"""
    cache_key = get_cache_key("task_list", user_id, project_id or "all")
    try:
        cache.set(cache_key, json.dumps(tasks_data), CACHE_TIMEOUTS["task_list"])
    except Exception as e:
        logger.error(f"Error caching task list: {e}")


def get_cached_task_list(user_id: int, project_id: Optional[int]) -> Optional[list]:
    """Get cached task list"""
    cache_key = get_cache_key("task_list", user_id, project_id or "all")
    try:
        cached_data = cache.get(cache_key)
        if cached_data:
            return json.loads(cached_data)
    except Exception as e:
        logger.error(f"Error retrieving cached task list: {e}")
    return None


def cache_task_detail(user_id: int, task_id: int, task_data: dict) -> None:
    """Cache task detail"""
    cache_key = get_cache_key("task_detail", user_id, task_id)
    try:
        cache.set(cache_key, json.dumps(task_data), CACHE_TIMEOUTS["task_detail"])
    except Exception as e:
        logger.error(f"Error caching task detail: {e}")


def get_cached_task_detail(user_id: int, task_id: int) -> Optional[dict]:
    """Get cached task detail"""
    cache_key = get_cache_key("task_detail", user_id, task_id)
    try:
        cached_data = cache.get(cache_key)
        if cached_data:
            return json.loads(cached_data)
    except Exception as e:
        logger.error(f"Error retrieving cached task detail: {e}")
    return None


def cache_statistics(user_id: int, stats_data: dict) -> None:
    """Cache statistics"""
    cache_key = get_cache_key("statistics", user_id)
    try:
        cache.set(cache_key, json.dumps(stats_data), CACHE_TIMEOUTS["statistics"])
    except Exception as e:
        logger.error(f"Error caching statistics: {e}")


def get_cached_statistics(user_id: int) -> Optional[dict]:
    """Get cached statistics"""
    cache_key = get_cache_key("statistics", user_id)
    try:
        cached_data = cache.get(cache_key)
        if cached_data:
            return json.loads(cached_data)
    except Exception as e:
        logger.error(f"Error retrieving cached statistics: {e}")
    return None


def invalidate_project_cache(user_id: int, project_id: Optional[int] = None) -> None:
    """Invalidate project-related cache"""
    try:
        # Invalidate project list
        cache.delete(get_cache_key("project_list", user_id))

        # Invalidate specific project if provided
        if project_id:
            cache.delete(get_cache_key("project_detail", user_id, project_id))

        # Invalidate task lists (they depend on projects)
        cache.delete(get_cache_key("task_list", user_id, "all"))
        if project_id:
            cache.delete(get_cache_key("task_list", user_id, project_id))

        # Invalidate statistics
        cache.delete(get_cache_key("statistics", user_id))
    except Exception as e:
        logger.error(f"Error invalidating project cache: {e}")


def invalidate_task_cache(user_id: int, task_id: Optional[int] = None, project_id: Optional[int] = None) -> None:
    """Invalidate task-related cache"""
    try:
        # Invalidate task lists
        cache.delete(get_cache_key("task_list", user_id, "all"))
        if project_id:
            cache.delete(get_cache_key("task_list", user_id, project_id))

        # Invalidate specific task if provided
        if task_id:
            cache.delete(get_cache_key("task_detail", user_id, task_id))

        # Invalidate statistics
        cache.delete(get_cache_key("statistics", user_id))
    except Exception as e:
        logger.error(f"Error invalidating task cache: {e}")


def invalidate_user_cache(user_id: int) -> None:
    """Invalidate all cache for a user"""
    try:
        # Get all cache keys for this user (if using Redis)
        # This is a simplified version - in production, you might want to use Redis SCAN
        patterns = [
            get_cache_key("project_list", user_id),
            get_cache_key("task_list", user_id, "all"),
            get_cache_key("statistics", user_id),
        ]

        for pattern in patterns:
            cache.delete(pattern)
    except Exception as e:
        logger.error(f"Error invalidating user cache: {e}")
