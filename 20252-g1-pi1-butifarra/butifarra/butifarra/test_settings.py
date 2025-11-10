"""
Test settings for running pytest tests with SQLite
"""
from butifarra.settings import *  # noqa: F401,F403

# Override database to use SQLite for tests
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Disable migrations for faster tests
# This will create tables directly from models instead of running migrations
class DisableMigrations:
    def __contains__(self, item):
        return True

    def __getitem__(self, item):
        return None


# IMPORTANT: Disable migrations to avoid issues with JSONField in SQLite
MIGRATION_MODULES = DisableMigrations()

# Speed up password hashing in tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Disable debug for tests
DEBUG = False

# Email backend for tests
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# --- Ensure actividades app is loaded during tests ---
try:
    INSTALLED_APPS  # noqa
except NameError:
    INSTALLED_APPS = []

INSTALLED_APPS = list(INSTALLED_APPS)

# Lo más seguro: registrar el AppConfig explícito
if "butifarra.actividades.apps.ActividadesConfig" not in INSTALLED_APPS:
    INSTALLED_APPS.append("butifarra.actividades.apps.ActividadesConfig")

