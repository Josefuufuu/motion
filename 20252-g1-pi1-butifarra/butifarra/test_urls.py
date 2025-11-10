from django.urls import path

from butifarra.actividades import views

urlpatterns = [
    path("api/reports/dashboard/", views.api_reports_dashboard),
]
