from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth.models import User
from django.db import transaction
from actividades.models import Activity

import random
from datetime import timedelta, datetime
import json


class Command(BaseCommand):
    help = 'Creates sample activities for testing'

    @transaction.atomic
    def handle(self, *args, **kwargs):
        # Ensure we have at least one user for created_by
        try:
            admin_user = User.objects.get(username='admin')
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING('Admin user not found. Creating a new admin user...'))
            admin_user = User.objects.create_superuser(
                'admin', 'admin@example.com', 'admin123'
            )
            self.stdout.write(self.style.SUCCESS('Created admin user'))

        # Sample data for activities
        activities = [
            {
                'title': 'Torneo de Ajedrez',
                'category': 'DEPORTE',
                'description': 'Torneo abierto de ajedrez para todos los niveles. Trae tu propio tablero si es posible.',
                'location': 'Sala de Juegos - Edificio Central',
                'capacity': 30,
                'instructor': 'Carlos Jiménez',
                'tags': ['ajedrez', 'competencia', 'estrategia']
            },
            {
                'title': 'Yoga Matutino',
                'category': 'BIENESTAR',
                'description': 'Sesión de yoga para principiantes y nivel intermedio. Traer ropa cómoda y esterilla.',
                'location': 'Salón de Danza - Edificio Deportes',
                'capacity': 20,
                'instructor': 'Ana María López',
                'tags': ['yoga', 'bienestar', 'mañana']
            },
            {
                'title': 'Taller de Fotografía',
                'category': 'CULTURA',
                'description': 'Aprende técnicas básicas de fotografía digital. Se recomienda traer cámara propia.',
                'location': 'Aula 302 - Edificio de Artes',
                'capacity': 15,
                'instructor': 'Roberto Sánchez',
                'tags': ['fotografía', 'arte', 'taller']
            },
            {
                'title': 'Feria de Emprendimiento',
                'category': 'EVENTO',
                'description': 'Muestra de proyectos estudiantiles y networking con empresas locales.',
                'location': 'Plaza Central',
                'capacity': 200,
                'instructor': '',
                'tags': ['emprendimiento', 'networking', 'carrera']
            }
        ]

        # Calculate dates
        now = timezone.now()
        base_date = now.replace(hour=9, minute=0, second=0, microsecond=0)

        count = 0
        for idx, activity_data in enumerate(activities):
            # Set different dates for each activity
            start_date = base_date + timedelta(days=idx+1)
            end_date = start_date + timedelta(hours=random.randint(1, 3))

            # Check if activity already exists
            if Activity.objects.filter(title=activity_data['title'], start=start_date).exists():
                self.stdout.write(self.style.WARNING(f"Activity '{activity_data['title']}' already exists, skipping"))
                continue

            # Create the activity
            activity = Activity.objects.create(
                title=activity_data['title'],
                category=activity_data['category'],
                description=activity_data['description'],
                location=activity_data['location'],
                start=start_date,
                end=end_date,
                capacity=activity_data['capacity'],
                available_spots=activity_data['capacity'],
                instructor=activity_data['instructor'],
                visibility='public',
                status='active',
                tags=activity_data['tags'],  # Now correctly handled as JSON
                created_by=admin_user
            )
            count += 1

            self.stdout.write(self.style.SUCCESS(f"Created activity: {activity.title} on {activity.start}"))

        self.stdout.write(self.style.SUCCESS(f"Successfully created {count} sample activities"))
