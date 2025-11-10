"""Minimal stub for django_filters.rest_framework."""

class DjangoFilterBackend:
    def filter_queryset(self, request, queryset, view):  # pragma: no cover - simple stub
        return queryset

__all__ = ["DjangoFilterBackend"]
