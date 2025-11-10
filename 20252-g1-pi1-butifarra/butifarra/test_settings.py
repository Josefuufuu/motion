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

class DisableMigrations:
    def __contains__(self, item):
        return True

    def __getitem__(self, item):
        return None

# MIGRATION_MODULES = DisableMigrations()

PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

DEBUG = False

EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# ✅ ADD THIS
INSTALLED_APPS += [
    "butifarra.actividades",
]


# --- Ensure actividades app is loaded during tests ---
try:
    INSTALLED_APPS  # noqa
except NameError:
    INSTALLED_APPS = []

# Fuerza a lista por si en settings.py era tupla
INSTALLED_APPS = list(INSTALLED_APPS)

# Usa el AppConfig explícito (más seguro)
if "butifarra.actividades.apps.ActividadesConfig" not in INSTALLED_APPS:
    INSTALLED_APPS.append("butifarra.actividades.apps.ActividadesConfig")


