import os
import sys
import django
from django.conf import settings

# Add both the project root and butifarra directory to the sys.path
project_path = os.path.dirname(os.path.abspath(__file__))
butifarra_path = os.path.join(project_path, "butifarra")

sys.path.insert(0, project_path)
sys.path.insert(0, butifarra_path)

# Configure Django settings - use test_settings for tests
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "butifarra.test_settings")
django.setup()
