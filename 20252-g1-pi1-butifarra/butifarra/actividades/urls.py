# actividades/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

# Create a router for the Activity and Tournament viewsets
router = DefaultRouter()
router.register(r'api/actividades', views.ActivityViewSet)
router.register(r'api/torneos', views.TournamentViewSet)

urlpatterns = [
    path('', views.login_view, name='login'),  # Ruta principal de la aplicación
    path('login/', views.login_view, name='login'),  # Ruta para iniciar sesión
    path('register/', views.register_view, name='register'),  # Ruta para registro
    path('logout/', views.logout_view, name='logout'),
    path('index/', views.index, name='index'),  # Ruta para la página principal
    path('api/login/', views.api_login),
    path('api/logout/', views.api_logout),
    path('api/session/', views.api_session),
    # POST JSON payload: {"username", "email", "password1", "password2"}
    path('api/register/', views.api_register),
    # User activities endpoint for calendars
    path('api/user/activities', views.api_user_activities),
    # List professors
    path('api/professors/', views.api_professors),

    # Include the router URLs for the Activity and Tournament APIs
    path('', include(router.urls)),
]

# Sin cambios necesarios, las nuevas acciones del ViewSet se exponen automáticamente mediante router.
