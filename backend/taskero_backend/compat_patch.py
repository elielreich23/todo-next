"""
Compatibility patch for Python 3.14 and Django template context.

This fixes compatibility issues between Django 5.1.4 and Python 3.14:
1. AttributeError: 'super' object has no attribute 'dicts'
2. AttributeError: 'RequestContext' object has no attribute '_processors_index'
"""

import sys

# Only apply patch for Python 3.14+
if sys.version_info >= (3, 14):
    try:
        from django.template import context

        # Store the original __copy__ method
        _original_context_copy = context.Context.__copy__

        def _patched_context_copy(self):
            """
            Patched __copy__ method that works with Python 3.14.
            Bypasses the problematic super().__copy__() call.
            Replicates the behavior of the original __copy__ without using super().
            """
            # Use __new__ to create instance without calling __init__
            duplicate = object.__new__(self.__class__)

            # Initialize dicts - copy the list (shallow copy, preserving dict references)
            duplicate.dicts = list(self.dicts) if hasattr(self, "dicts") and self.dicts else []

            # Copy processors if they exist
            if hasattr(self, "_processors"):
                duplicate._processors = self._processors

            # Copy other optional attributes
            for attr in ["current_app", "request"]:
                if hasattr(self, attr):
                    setattr(duplicate, attr, getattr(self, attr))

            return duplicate

        # Apply the patch
        context.Context.__copy__ = _patched_context_copy

        # Also patch RequestContext if it exists
        if hasattr(context, "RequestContext"):
            # Store original methods
            _original_request_context_init = context.RequestContext.__init__
            _original_request_context_copy = context.RequestContext.__copy__

            def _patched_request_context_init(self, *args, **kwargs):
                """
                Patched __init__ method for RequestContext to ensure _processors_index is initialized.
                Accepts all arguments that Django 5.1.4+ may pass (including autoescape).
                """
                # Ensure dicts exists before calling __init__
                if not hasattr(self, "dicts") or self.dicts is None:
                    self.dicts = []

                # Capture the initial length of dicts before calling __init__
                # This is needed because processors may add to dicts during __init__
                initial_dicts_len = len(self.dicts)

                # Call the original __init__ with all arguments as-is
                _original_request_context_init(self, *args, **kwargs)

                # Ensure dicts still exists after __init__
                if not hasattr(self, "dicts") or self.dicts is None:
                    self.dicts = []

                # Ensure _processors_index exists (needed for bind_template)
                # _processors_index tracks where processor-added context starts in the dicts list
                # It should be the length of dicts BEFORE processors ran
                if not hasattr(self, "_processors_index"):
                    # Use the initial length we captured
                    # This represents where processors started adding dictionaries
                    # Don't extend the list here - let bind_template handle that
                    self._processors_index = initial_dicts_len

            def _patched_request_context_copy(self):
                """
                Patched __copy__ method for RequestContext.
                """
                # Create new RequestContext with the same request
                duplicate = self.__class__(self.request)

                # Copy the dicts list
                if hasattr(self, "dicts") and self.dicts:
                    duplicate.dicts = list(self.dicts)
                else:
                    duplicate.dicts = []

                # Copy processors if they exist
                if hasattr(self, "_processors"):
                    duplicate._processors = self._processors

                # Copy _processors_index if it exists
                if hasattr(self, "_processors_index"):
                    duplicate._processors_index = self._processors_index

                return duplicate

            # Apply patches
            context.RequestContext.__init__ = _patched_request_context_init
            context.RequestContext.__copy__ = _patched_request_context_copy

            # Also patch bind_template to handle missing _processors_index gracefully
            if hasattr(context.RequestContext, "bind_template"):
                _original_bind_template = context.RequestContext.bind_template

                def _patched_bind_template(self, template):
                    """
                    Patched bind_template to ensure _processors_index exists and dicts list is properly sized.
                    This is critical to prevent IndexError when Django tries to assign to dicts[_processors_index].
                    """
                    # Ensure dicts exists and is a list
                    if not hasattr(self, "dicts") or self.dicts is None:
                        self.dicts = []

                    # Ensure dicts is actually a list (not None or other type)
                    if not isinstance(self.dicts, list):
                        self.dicts = list(self.dicts) if self.dicts else []

                    current_dicts_len = len(self.dicts)

                    # Initialize or validate _processors_index
                    if not hasattr(self, "_processors_index"):
                        # Set to current length (where processors will start adding)
                        self._processors_index = current_dicts_len
                    else:
                        # Validate and fix _processors_index
                        if self._processors_index < 0:
                            self._processors_index = 0

                    # CRITICAL: Ensure dicts list is large enough to accommodate _processors_index
                    # Django's bind_template will try to assign to dicts[_processors_index], so we need
                    # at least _processors_index + 1 elements in the list (since list indices are 0-based)
                    # We add empty dicts to extend the list if needed
                    required_length = self._processors_index + 1
                    while len(self.dicts) < required_length:
                        self.dicts.append({})

                    # Final safety check - ensure we have at least one more than needed
                    # This handles any edge cases where Django might need extra space
                    if len(self.dicts) == required_length:
                        self.dicts.append({})

                    # Now call the original bind_template - it should be safe
                    try:
                        return _original_bind_template(self, template)
                    except IndexError as e:
                        # If we still get an IndexError, it means our patch didn't work correctly
                        # Log the error and try to fix it
                        import logging

                        logger = logging.getLogger(__name__)
                        logger.warning(
                            f"IndexError in bind_template: {e}. "
                            f"dicts len: {len(self.dicts)}, "
                            f"_processors_index: {self._processors_index}"
                        )

                        # Emergency fix: ensure list is definitely large enough
                        while len(self.dicts) <= self._processors_index + 1:
                            self.dicts.append({})

                        # Try again
                        return _original_bind_template(self, template)

                context.RequestContext.bind_template = _patched_bind_template
    except ImportError:
        # Django not loaded yet, will be patched when Django loads
        pass
