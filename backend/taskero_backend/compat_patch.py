"""
Compatibility patch for Python 3.14 and Django template context.

This fixes the AttributeError: 'super' object has no attribute 'dicts'
that occurs in Django's template context system with Python 3.14.
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
            duplicate.dicts = list(self.dicts) if hasattr(self, 'dicts') and self.dicts else []
            
            # Copy processors if they exist
            if hasattr(self, '_processors'):
                duplicate._processors = self._processors
            
            # Copy other optional attributes
            for attr in ['current_app', 'request']:
                if hasattr(self, attr):
                    setattr(duplicate, attr, getattr(self, attr))
            
            return duplicate
        
        # Apply the patch
        context.Context.__copy__ = _patched_context_copy
        
        # Also patch RequestContext if it exists
        if hasattr(context, 'RequestContext'):
            _original_request_context_copy = context.RequestContext.__copy__
            
            def _patched_request_context_copy(self):
                """
                Patched __copy__ method for RequestContext.
                """
                # Create new RequestContext with the same request
                duplicate = self.__class__(self.request)
                
                # Copy the dicts list
                if hasattr(self, 'dicts') and self.dicts:
                    duplicate.dicts = list(self.dicts)
                else:
                    duplicate.dicts = []
                
                # Copy processors if they exist
                if hasattr(self, '_processors'):
                    duplicate._processors = self._processors
                
                return duplicate
            
            context.RequestContext.__copy__ = _patched_request_context_copy
    except ImportError:
        # Django not loaded yet, will be patched when Django loads
        pass

