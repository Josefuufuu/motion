"""Local stub implementation of django_filters used for tests."""

from importlib import import_module

__all__ = ["rest_framework"]


def __getattr__(name):
    if name == "rest_framework":
        return import_module("django_filters.rest_framework")
    raise AttributeError(name)
