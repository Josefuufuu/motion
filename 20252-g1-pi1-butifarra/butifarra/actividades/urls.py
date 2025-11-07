from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'api/actividades', views.ActivityViewSet)
router.register(r'api/proyectos', views.ProjectViewSet)
router.register(r'api/inscripciones', views.EnrollmentViewSet, basename='enrollment')

urlpatterns = [
    path('', views.login_view, name='login'),
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),
    path('index/', views.index, name='index'),
    path('api/login/', views.api_login),
    path('api/logout/', views.api_logout),
    path('api/session/', views.api_session),
    path('api/register/', views.api_register),
    # User activities endpoint for calendars
    path('api/user/activities', views.api_user_activities),

    path('', include(router.urls)),
]
