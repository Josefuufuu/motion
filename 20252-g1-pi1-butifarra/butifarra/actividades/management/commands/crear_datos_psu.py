from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from actividades.models import Project, Enrollment
from datetime import date, timedelta


class Command(BaseCommand):
    help = 'Create test data for PSU and Volunteer projects'

    def handle(self, *args, **options):
        self.stdout.write('Creating test data...')

        projects_data = [
            {
                'name': 'Proyecto Ambiental Campus Verde',
                'type': 'VOLUNTEER',
                'area': 'Ambiental',
                'subtype': 'Sostenibilidad',
                'description': 'Programa de reforestación y cuidado del medio ambiente en el campus universitario.',
                'total_quota': 20,
                'start_date': date.today() + timedelta(days=7),
                'end_date': date.today() + timedelta(days=90),
                'status': 'enrollment'
            },
            {
                'name': 'Apoyo Educativo en Comunidades Rurales',
                'type': 'PSU',
                'area': 'Educación',
                'subtype': 'Alfabetización',
                'description': 'Programa de apoyo escolar y alfabetización para niños en zonas rurales.',
                'total_quota': 15,
                'start_date': date.today() + timedelta(days=14),
                'end_date': date.today() + timedelta(days=120),
                'status': 'enrollment'
            },
            {
                'name': 'Banco de Alimentos Universitario',
                'type': 'VOLUNTEER',
                'area': 'Social',
                'subtype': 'Alimentación',
                'description': 'Recolección y distribución de alimentos para estudiantes en situación de vulnerabilidad.',
                'total_quota': 25,
                'start_date': date.today() + timedelta(days=3),
                'end_date': date.today() + timedelta(days=180),
                'status': 'enrollment'
            },
            {
                'name': 'Atención Médica Comunitaria',
                'type': 'PSU',
                'area': 'Salud',
                'subtype': 'Atención Primaria',
                'description': 'Jornadas de atención médica básica en comunidades de bajos recursos.',
                'total_quota': 10,
                'start_date': date.today() - timedelta(days=10),
                'end_date': date.today() + timedelta(days=50),
                'status': 'ongoing'
            },
            {
                'name': 'Cultura y Arte para Todos',
                'type': 'VOLUNTEER',
                'area': 'Cultural',
                'subtype': 'Expresión Artística',
                'description': 'Talleres de arte, música y danza para niños y jóvenes de barrios populares.',
                'total_quota': 18,
                'start_date': date.today() + timedelta(days=21),
                'end_date': date.today() + timedelta(days=150),
                'status': 'enrollment'
            },
        ]

        projects_created = []
        for project_data in projects_data:
            project, created = Project.objects.get_or_create(
                name=project_data['name'],
                defaults=project_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  [OK] Created: {project.name}'))
                projects_created.append(project)
            else:
                self.stdout.write(self.style.WARNING(f'  - Already exists: {project.name}'))
                projects_created.append(project)

        enrollments_data = [
            {
                'project': projects_created[0],
                'full_name': 'María González Pérez',
                'email': 'maria.gonzalez@example.com',
                'phone': '3001234567',
                'status': 'confirmed'
            },
            {
                'project': projects_created[0],
                'full_name': 'Juan Carlos Rodríguez',
                'email': 'juan.rodriguez@example.com',
                'phone': '3009876543',
                'status': 'confirmed'
            },
            {
                'project': projects_created[1],
                'full_name': 'Ana María López',
                'email': 'ana.lopez@example.com',
                'phone': '3005551234',
                'status': 'confirmed'
            },
            {
                'project': projects_created[2],
                'full_name': 'Carlos Eduardo Martínez',
                'email': 'carlos.martinez@example.com',
                'phone': '3007778888',
                'status': 'confirmed'
            },
            {
                'project': projects_created[2],
                'full_name': 'Laura Sofía Ramírez',
                'email': 'laura.ramirez@example.com',
                'phone': '3002223333',
                'status': 'pending'
            },
        ]

        for enrollment_data in enrollments_data:
            enrollment, created = Enrollment.objects.get_or_create(
                project=enrollment_data['project'],
                email=enrollment_data['email'],
                defaults=enrollment_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  [OK] Enrollment created: {enrollment.full_name} -> {enrollment.project.name}'))
            else:
                self.stdout.write(self.style.WARNING(f'  - Enrollment already exists: {enrollment.full_name}'))

        self.stdout.write(self.style.SUCCESS('\nTest data created successfully!'))
        self.stdout.write(f'\nSummary:')
        self.stdout.write(f'  - Projects created: {len(projects_created)}')
        self.stdout.write(f'  - Enrollments created: {len(enrollments_data)}')
        self.stdout.write(f'\nView projects at: /api/proyectos/?status=enrollment')
        self.stdout.write(f'Create enrollments at: /api/inscripciones/\n')
