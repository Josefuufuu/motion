# actividades/urls.py

from django.urls import path, include
from django.views.generic import RedirectView
from rest_framework.routers import DefaultRouter
from rest_framework.response import Response
from rest_framework.decorators import api_view

from . import views
from .views import NotificationViewSet

# Create a router for the Activity and Tournament viewsets
router = DefaultRouter()
router.register(r'api/actividades', views.ActivityViewSet)
router.register(r'api/torneos', views.TournamentViewSet)
# Register notifications and campaigns
router.register(r'api/notifications', views.NotificationViewSet, basename='notifications')
router.register(r'api/campaigns', views.CampaignViewSet, basename='campaigns')

# Alias JSON para /api/notificaciones/ -> /api/notifications/
@api_view(['GET'])
def api_notificaciones_alias(request):
    viewset = NotificationViewSet.as_view({'get': 'list'})
    return viewset(request)

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
    path('api/reports/dashboard/', views.api_reports_dashboard),
    # Notification preferences
    path('api/notification-preferences/', views.api_notification_preferences),

    # Include the router URLs for all APIs
    path('', include(router.urls)),
    # Alias de la página de notificaciones (frontend) para evitar 404 si el backend intenta resolverla
    path('notificaciones/', RedirectView.as_view(url='/'), name='notificaciones-alias'),
    # Alias API en español
    path('api/notificaciones/', api_notificaciones_alias, name='api-notificaciones-alias'),
]

# Sin cambios necesarios, las nuevas acciones del ViewSet se exponen automáticamente mediante router.
