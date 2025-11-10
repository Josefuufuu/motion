from django.apps import AppConfig

class ActividadesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    # Debe ser el path completo del paquete
    name = 'butifarra.actividades'
    label = 'actividades'  # opcional pero recomendable

