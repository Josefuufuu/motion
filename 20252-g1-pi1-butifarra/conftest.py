import os
import sys
import django
import pytest
from django.core.management import call_command

# Add both the project root and butifarra directory to the sys.path
project_path = os.path.dirname(os.path.abspath(__file__))
butifarra_path = os.path.join(project_path, "butifarra")

sys.path.insert(0, project_path)
if butifarra_path not in sys.path:
    sys.path.append(butifarra_path)

# Configure Django settings - use test_settings for tests
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "butifarra.test_settings")
django.setup()


@pytest.fixture(scope="session", autouse=True)
def _apply_migrations():
    """Ensure the test database has the required tables before tests run."""
    call_command("migrate", run_syncdb=True, verbosity=0)
