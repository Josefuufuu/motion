"""Minimal stub for django_filters.rest_framework.

This allows running management commands in environments where the third-party
package cannot be installed.
"""

class DjangoFilterBackend:
    def filter_queryset(self, request, queryset, view):
        return queryset


__all__ = ["DjangoFilterBackend"]
