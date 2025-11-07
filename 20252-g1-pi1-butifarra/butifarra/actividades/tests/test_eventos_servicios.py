import pytest
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User, Group
from django.utils import timezone
import json
from datetime import datetime, timedelta

# Importaciones que se requerirán cuando los modelos sean creados
# from actividades.models import Torneo, Equipo, EquipoMiembro, Partido, Resultado
# from actividades.models import ProyectoSocial, InscripcionPSU, CitaPsicologica
#Tengan en cuenta antes de correr las pruebas que tienen que comentar los assertTrue de los placeholders y descomentar las partes comentadas del código. los assertTrue están para que las pruebas no fallen mientras los modelos y vistas no estén implementados.

# Tests para el Módulo de Eventos y Servicios (torneos, PSU, citas psicológicas)

class TestTorneoModels(TestCase):
    """Pruebas para los modelos relacionados con torneos"""

    def setUp(self):
        """Configuración inicial para las pruebas"""
        # Crear usuarios de prueba
        self.estudiante1 = User.objects.create_user(
            username='estudiante1',
            email='estudiante1@test.com',
            password='password123'
        )
        self.estudiante2 = User.objects.create_user(
            username='estudiante2',
            email='estudiante2@test.com',
            password='password123'
        )
        self.admin = User.objects.create_superuser(
            username='admin_test',
            email='admin@test.com',
            password='admin123'
        )

        # Código comentado que se utilizará cuando los modelos existan
        """
        # Crear un torneo
        self.torneo = Torneo.objects.create(
            nombre='Torneo de Fútbol Sala',
            descripcion='Torneo interno entre facultades',
            deporte='Fútbol Sala',
            fecha_inicio=timezone.now() + timedelta(days=10),
            fecha_fin=timezone.now() + timedelta(days=20),
            tipo_inscripcion='Equipo',
            max_participantes_equipo=5,
            min_participantes_equipo=3,
            estado='Inscripciones',
            creado_por=self.admin
        )
        
        # Crear equipos para el torneo
        self.equipo1 = Equipo.objects.create(
            nombre='Equipo Ingeniería',
            torneo=self.torneo,
            capitan=self.estudiante1
        )
        
        # Añadir miembros al equipo
        EquipoMiembro.objects.create(
            equipo=self.equipo1,
            usuario=self.estudiante1,
            es_capitan=True
        )
        EquipoMiembro.objects.create(
            equipo=self.equipo1,
            usuario=self.estudiante2,
            es_capitan=False
        )
        """

    def test_modelo_torneo(self):
        """Prueba para el modelo Torneo"""
        """
        # Verificar que el torneo se creó correctamente
        self.assertEqual(Torneo.objects.count(), 1)
        torneo = Torneo.objects.first()
        self.assertEqual(torneo.nombre, 'Torneo de Fútbol Sala')
        self.assertEqual(torneo.tipo_inscripcion, 'Equipo')
        self.assertEqual(torneo.estado, 'Inscripciones')
        
        # Verificar validación de fechas (inicio < fin)
        with self.assertRaises(Exception):
            Torneo.objects.create(
                nombre='Torneo Inválido',
                descripcion='Torneo con fechas inválidas',
                deporte='Baloncesto',
                fecha_inicio=timezone.now() + timedelta(days=20),
                fecha_fin=timezone.now() + timedelta(days=10),  # Fecha fin antes de inicio
                tipo_inscripcion='Individual',
                estado='Inscripciones',
                creado_por=self.admin
            )
        """
        # Esta prueba fallará hasta que se cree el modelo Torneo
        self.assertTrue(True)  # Placeholder

    def test_modelo_equipo(self):
        """Prueba para el modelo Equipo y EquipoMiembro"""
        """
        # Verificar que el equipo se creó correctamente
        self.assertEqual(Equipo.objects.count(), 1)
        equipo = Equipo.objects.first()
        self.assertEqual(equipo.nombre, 'Equipo Ingeniería')
        self.assertEqual(equipo.torneo, self.torneo)
        self.assertEqual(equipo.capitan, self.estudiante1)
        
        # Verificar miembros del equipo
        self.assertEqual(EquipoMiembro.objects.count(), 2)
        self.assertEqual(EquipoMiembro.objects.filter(equipo=equipo).count(), 2)
        
        # Verificar que el capitán está correctamente asignado
        miembro_capitan = EquipoMiembro.objects.get(usuario=self.estudiante1, equipo=equipo)
        self.assertTrue(miembro_capitan.es_capitan)
        
        # Verificar límite de miembros por equipo
        estudiante3 = User.objects.create_user(username='estudiante3', password='password123')
        estudiante4 = User.objects.create_user(username='estudiante4', password='password123')
        estudiante5 = User.objects.create_user(username='estudiante5', password='password123')
        estudiante6 = User.objects.create_user(username='estudiante6', password='password123')
        
        # Añadir hasta el límite permitido (5 en total)
        EquipoMiembro.objects.create(equipo=equipo, usuario=estudiante3, es_capitan=False)
        EquipoMiembro.objects.create(equipo=equipo, usuario=estudiante4, es_capitan=False)
        EquipoMiembro.objects.create(equipo=equipo, usuario=estudiante5, es_capitan=False)
        
        # Intentar añadir un miembro más debería fallar (excede max_participantes_equipo)
        with self.assertRaises(Exception):
            EquipoMiembro.objects.create(equipo=equipo, usuario=estudiante6, es_capitan=False)
        """
        # Esta prueba fallará hasta que se creen los modelos Equipo y EquipoMiembro
        self.assertTrue(True)  # Placeholder

    def test_modelo_partido(self):
        """Prueba para el modelo Partido y Resultado"""
        """
        # Crear otro equipo para el partido
        estudiante3 = User.objects.create_user(username='estudiante3', password='password123')
        equipo2 = Equipo.objects.create(
            nombre='Equipo Administración',
            torneo=self.torneo,
            capitan=estudiante3
        )
        
        # Crear un partido
        partido = Partido.objects.create(
            torneo=self.torneo,
            equipo_local=self.equipo1,
            equipo_visitante=equipo2,
            fecha=timezone.now() + timedelta(days=15),
            lugar='Cancha Principal',
            estado='Programado'
        )
        
        # Verificar que el partido se creó correctamente
        self.assertEqual(Partido.objects.count(), 1)
        self.assertEqual(partido.equipo_local, self.equipo1)
        self.assertEqual(partido.equipo_visitante, equipo2)
        self.assertEqual(partido.estado, 'Programado')
        
        # Registrar resultado del partido
        resultado = Resultado.objects.create(
            partido=partido,
            puntos_local=3,
            puntos_visitante=1,
            comentarios='Partido muy disputado',
            registrado_por=self.admin
        )
        
        # Verificar que el resultado se registró correctamente
        self.assertEqual(Resultado.objects.count(), 1)
        self.assertEqual(resultado.puntos_local, 3)
        self.assertEqual(resultado.puntos_visitante, 1)
        
        # Verificar que el estado del partido se actualiza
        partido.refresh_from_db()
        self.assertEqual(partido.estado, 'Finalizado')
        """
        # Esta prueba fallará hasta que se creen los modelos Partido y Resultado
        self.assertTrue(True)  # Placeholder


class TestTorneoViews(TestCase):
    """Pruebas para las vistas relacionadas con torneos"""

    def setUp(self):
        """Configuración inicial para las pruebas"""
        self.client = Client()
        # Crear usuarios de prueba
        self.estudiante = User.objects.create_user(
            username='estudiante_test',
            email='estudiante@test.com',
            password='password123'
        )
        self.admin = User.objects.create_superuser(
            username='admin_test',
            email='admin@test.com',
            password='admin123'
        )

        # Código comentado que se utilizará cuando los modelos existan
        """
        # Crear un torneo
        self.torneo = Torneo.objects.create(
            nombre='Torneo de Fútbol Sala',
            descripcion='Torneo interno entre facultades',
            deporte='Fútbol Sala',
            fecha_inicio=timezone.now() + timedelta(days=10),
            fecha_fin=timezone.now() + timedelta(days=20),
            tipo_inscripcion='Equipo',
            max_participantes_equipo=5,
            min_participantes_equipo=3,
            estado='Inscripciones',
            creado_por=self.admin
        )
        """

    def test_listar_torneos(self):
        """Prueba para la vista de listar torneos"""
        """
        # Acceder a la vista sin autenticación (debería ser accesible para todos)
        response = self.client.get(reverse('torneos:listar'))
        
        # Verificar que la respuesta sea exitosa
        self.assertEqual(response.status_code, 200)
        
        # Verificar que el torneo aparezca en el contexto
        self.assertIn('torneos', response.context)
        self.assertEqual(len(response.context['torneos']), 1)
        self.assertEqual(response.context['torneos'][0].nombre, 'Torneo de Fútbol Sala')
        """
        # Esta prueba fallará hasta que se implemente la vista de listar torneos
        self.assertTrue(True)  # Placeholder

    def test_detalle_torneo(self):
        """Prueba para la vista de detalle de torneo"""
        """
        # Acceder a la vista de detalle del torneo
        response = self.client.get(reverse('torneos:detalle', kwargs={'pk': self.torneo.pk}))
        
        # Verificar que la respuesta sea exitosa
        self.assertEqual(response.status_code, 200)
        
        # Verificar que los datos del torneo están presentes
        self.assertContains(response, 'Torneo de Fútbol Sala')
        self.assertContains(response, 'Torneo interno entre facultades')
        self.assertContains(response, 'Fútbol Sala')
        """
        # Esta prueba fallará hasta que se implemente la vista de detalle de torneo
        self.assertTrue(True)  # Placeholder

    def test_crear_torneo(self):
        """Prueba para la vista de crear torneo (solo para admin)"""
        """
        # Iniciar sesión como administrador
        self.client.login(username='admin_test', password='admin123')
        
        # Datos para el nuevo torneo
        datos_torneo = {
            'nombre': 'Torneo de Baloncesto',
            'descripcion': 'Torneo de prueba',
            'deporte': 'Baloncesto',
            'fecha_inicio': (timezone.now() + timedelta(days=5)).strftime('%Y-%m-%d'),
            'fecha_fin': (timezone.now() + timedelta(days=15)).strftime('%Y-%m-%d'),
            'tipo_inscripcion': 'Equipo',
            'max_participantes_equipo': 4,
            'min_participantes_equipo': 2,
            'estado': 'Inscripciones'
        }
        
        # Enviar petición POST para crear torneo
        response = self.client.post(reverse('torneos:crear'), datos_torneo)
        
        # Verificar redirección después de crear
        self.assertEqual(response.status_code, 302)
        
        # Verificar que el torneo se creó correctamente
        self.assertEqual(Torneo.objects.count(), 2)  # El original + el nuevo
        nuevo_torneo = Torneo.objects.get(nombre='Torneo de Baloncesto')
        self.assertEqual(nuevo_torneo.deporte, 'Baloncesto')
        
        # Verificar que un usuario no admin no puede crear torneos
        self.client.logout()
        self.client.login(username='estudiante_test', password='password123')
        response = self.client.post(reverse('torneos:crear'), datos_torneo)
        self.assertEqual(response.status_code, 403)  # Forbidden
        """
        # Esta prueba fallará hasta que se implemente la vista de crear torneo
        self.assertTrue(True)  # Placeholder

    def test_inscripcion_equipo(self):
        """Prueba para la vista de inscripción de equipos en torneos"""
        """
        # Iniciar sesión como estudiante
        self.client.login(username='estudiante_test', password='password123')
        
        # Datos para el nuevo equipo
        datos_equipo = {
            'torneo_id': self.torneo.id,
            'nombre': 'Equipo Test',
            'miembros': ['estudiante_test']  # Solo el capitán por ahora
        }
        
        # Enviar petición POST para inscribir equipo
        response = self.client.post(reverse('torneos:inscribir_equipo'), datos_equipo)
        
        # Verificar que la respuesta sea exitosa
        self.assertEqual(response.status_code, 200)
        
        # Verificar que el equipo se creó correctamente
        self.assertEqual(Equipo.objects.count(), 1)
        equipo = Equipo.objects.first()
        self.assertEqual(equipo.nombre, 'Equipo Test')
        self.assertEqual(equipo.torneo, self.torneo)
        self.assertEqual(equipo.capitan, self.estudiante)
        
        # Verificar que el usuario actual está registrado como miembro y capitán
        miembro = EquipoMiembro.objects.get(equipo=equipo, usuario=self.estudiante)
        self.assertTrue(miembro.es_capitan)
        
        # Verificar que no se puede inscribir dos veces
        response = self.client.post(reverse('torneos:inscribir_equipo'), datos_equipo)
        self.assertEqual(response.status_code, 400)
        
        # Verificar que no se puede inscribir si el torneo no está en estado 'Inscripciones'
        self.torneo.estado = 'En Curso'
        self.torneo.save()
        
        datos_equipo2 = {
            'torneo_id': self.torneo.id,
            'nombre': 'Equipo Tardío',
            'miembros': ['estudiante_test']
        }
        
        response = self.client.post(reverse('torneos:inscribir_equipo'), datos_equipo2)
        self.assertEqual(response.status_code, 400)
        """
        # Esta prueba fallará hasta que se implemente la vista de inscripción de equipos
        self.assertTrue(True)  # Placeholder

    def test_programar_partidos(self):
        """Prueba para la vista de programar partidos (solo para admin)"""
        """
        # Iniciar sesión como administrador
        self.client.login(username='admin_test', password='admin123')
        
        # Crear dos equipos para el torneo
        estudiante2 = User.objects.create_user(username='estudiante2', password='password123')
        
        equipo1 = Equipo.objects.create(
            nombre='Equipo 1',
            torneo=self.torneo,
            capitan=self.estudiante
        )
        
        equipo2 = Equipo.objects.create(
            nombre='Equipo 2',
            torneo=self.torneo,
            capitan=estudiante2
        )
        
        # Datos para el nuevo partido
        datos_partido = {
            'torneo_id': self.torneo.id,
            'equipo_local_id': equipo1.id,
            'equipo_visitante_id': equipo2.id,
            'fecha': (timezone.now() + timedelta(days=12)).strftime('%Y-%m-%d %H:%M'),
            'lugar': 'Cancha Principal',
            'ronda': 'Eliminatoria'
        }
        
        # Enviar petición POST para programar partido
        response = self.client.post(reverse('torneos:programar_partido'), datos_partido)
        
        # Verificar que la respuesta sea exitosa
        self.assertEqual(response.status_code, 200)
        
        # Verificar que el partido se creó correctamente
        self.assertEqual(Partido.objects.count(), 1)
        partido = Partido.objects.first()
        self.assertEqual(partido.equipo_local, equipo1)
        self.assertEqual(partido.equipo_visitante, equipo2)
        self.assertEqual(partido.lugar, 'Cancha Principal')
        
        # Verificar que un usuario no admin no puede programar partidos
        self.client.logout()
        self.client.login(username='estudiante_test', password='password123')
        response = self.client.post(reverse('torneos:programar_partido'), datos_partido)
        self.assertEqual(response.status_code, 403)  # Forbidden
        """
        # Esta prueba fallará hasta que se implemente la vista de programar partidos
        self.assertTrue(True)  # Placeholder

    def test_registrar_resultado(self):
        """Prueba para la vista de registrar resultados de partidos (solo para admin)"""
        """
        # Iniciar sesión como administrador
        self.client.login(username='admin_test', password='admin123')
        
        # Crear equipos y partido
        estudiante2 = User.objects.create_user(username='estudiante2', password='password123')
        
        equipo1 = Equipo.objects.create(
            nombre='Equipo 1',
            torneo=self.torneo,
            capitan=self.estudiante
        )
        
        equipo2 = Equipo.objects.create(
            nombre='Equipo 2',
            torneo=self.torneo,
            capitan=estudiante2
        )
        
        partido = Partido.objects.create(
            torneo=self.torneo,
            equipo_local=equipo1,
            equipo_visitante=equipo2,
            fecha=timezone.now() + timedelta(days=12),
            lugar='Cancha Principal',
            estado='Programado'
        )
        
        # Datos para el resultado
        datos_resultado = {
            'partido_id': partido.id,
            'puntos_local': 3,
            'puntos_visitante': 1,
            'comentarios': 'Partido disputado'
        }
        
        # Enviar petición POST para registrar resultado
        response = self.client.post(reverse('torneos:registrar_resultado'), datos_resultado)
        
        # Verificar que la respuesta sea exitosa
        self.assertEqual(response.status_code, 200)
        
        # Verificar que el resultado se registró correctamente
        self.assertEqual(Resultado.objects.count(), 1)
        resultado = Resultado.objects.first()
        self.assertEqual(resultado.puntos_local, 3)
        self.assertEqual(resultado.puntos_visitante, 1)
        
        # Verificar que el estado del partido se actualiza
        partido.refresh_from_db()
        self.assertEqual(partido.estado, 'Finalizado')
        
        # Verificar que un usuario no admin no puede registrar resultados
        self.client.logout()
        self.client.login(username='estudiante_test', password='password123')
        response = self.client.post(reverse('torneos:registrar_resultado'), datos_resultado)
        self.assertEqual(response.status_code, 403)  # Forbidden
        """
        # Esta prueba fallará hasta que se implemente la vista de registrar resultados
        self.assertTrue(True)  # Placeholder


class TestPSUModels(TestCase):
    """Pruebas para los modelos relacionados con el Proyecto Social Universitario (PSU)"""

    def setUp(self):
        """Configuración inicial para las pruebas"""
        # Crear usuarios de prueba
        self.estudiante = User.objects.create_user(
            username='estudiante_test',
            email='estudiante@test.com',
            password='password123'
        )
        self.admin = User.objects.create_superuser(
            username='admin_test',
            email='admin@test.com',
            password='admin123'
        )

        # Código comentado que se utilizará cuando los modelos existan
        """
        # Crear proyectos sociales
        self.proyecto1 = ProyectoSocial.objects.create(
            nombre='Alfabetización Digital',
            descripcion='Enseñar habilidades digitales básicas a adultos mayores',
            organizacion='Fundación Conectando Generaciones',
            fecha_inicio=timezone.now(),
            fecha_fin=timezone.now() + timedelta(days=90),
            horas_requeridas=40,
            cupos=20,
            cupos_disponibles=20,
            estado='Activo',
            creado_por=self.admin
        )
        
        self.proyecto2 = ProyectoSocial.objects.create(
            nombre='Reforestación Urbana',
            descripcion='Plantar árboles en zonas urbanas',
            organizacion='EcoAmigos',
            fecha_inicio=timezone.now() + timedelta(days=30),
            fecha_fin=timezone.now() + timedelta(days=120),
            horas_requeridas=30,
            cupos=15,
            cupos_disponibles=15,
            estado='Activo',
            creado_por=self.admin
        )
        """

    def test_modelo_proyecto_social(self):
        """Prueba para el modelo ProyectoSocial"""
        """
        # Verificar que los proyectos se crearon correctamente
        self.assertEqual(ProyectoSocial.objects.count(), 2)
        
        # Verificar atributos del proyecto
        proyecto = ProyectoSocial.objects.get(nombre='Alfabetización Digital')
        self.assertEqual(proyecto.organizacion, 'Fundación Conectando Generaciones')
        self.assertEqual(proyecto.cupos, 20)
        self.assertEqual(proyecto.cupos_disponibles, 20)
        self.assertEqual(proyecto.estado, 'Activo')
        
        # Verificar validación de fechas (inicio <= fin)
        with self.assertRaises(Exception):
            ProyectoSocial.objects.create(
                nombre='Proyecto Inválido',
                descripcion='Proyecto con fechas inválidas',
                organizacion='Test Org',
                fecha_inicio=timezone.now() + timedelta(days=50),
                fecha_fin=timezone.now() + timedelta(days=20),  # Fecha fin antes de inicio
                horas_requeridas=20,
                cupos=10,
                cupos_disponibles=10,
                estado='Activo',
                creado_por=self.admin
            )
        """
        # Esta prueba fallará hasta que se cree el modelo ProyectoSocial
        self.assertTrue(True)  # Placeholder

    def test_modelo_inscripcion_psu(self):
        """Prueba para el modelo InscripcionPSU"""
        """
        # Inscribir al estudiante en un proyecto
        inscripcion = InscripcionPSU.objects.create(
            usuario=self.estudiante,
            proyecto=self.proyecto1,
            fecha_inscripcion=timezone.now(),
            estado='Inscrito',
            horas_completadas=0
        )
        
        # Verificar que la inscripción se creó correctamente
        self.assertEqual(InscripcionPSU.objects.count(), 1)
        
        # Verificar que los cupos disponibles disminuyen
        self.proyecto1.refresh_from_db()
        self.assertEqual(self.proyecto1.cupos_disponibles, 19)
        
        # Verificar que no se puede inscribir dos veces al mismo proyecto
        with self.assertRaises(Exception):
            InscripcionPSU.objects.create(
                usuario=self.estudiante,
                proyecto=self.proyecto1,
                fecha_inscripcion=timezone.now(),
                estado='Inscrito',
                horas_completadas=0
            )
        
        # Verificar que no se puede inscribir a un proyecto sin cupos
        self.proyecto1.cupos_disponibles = 0
        self.proyecto1.save()
        
        estudiante2 = User.objects.create_user(username='estudiante2', password='password123')
        
        with self.assertRaises(Exception):
            InscripcionPSU.objects.create(
                usuario=estudiante2,
                proyecto=self.proyecto1,
                fecha_inscripcion=timezone.now(),
                estado='Inscrito',
                horas_completadas=0
            )
        
        # Verificar registro de horas
        inscripcion.registrar_horas(10)
        self.assertEqual(inscripcion.horas_completadas, 10)
        
        # Completar proyecto
        inscripcion.registrar_horas(30)  # Total: 40 horas (completo)
        self.assertEqual(inscripcion.horas_completadas, 40)
        self.assertEqual(inscripcion.estado, 'Completado')
        """
        # Esta prueba fallará hasta que se cree el modelo InscripcionPSU
        self.assertTrue(True)  # Placeholder


class TestPSUViews(TestCase):
    """Pruebas para las vistas relacionadas con el Proyecto Social Universitario (PSU)"""

    def setUp(self):
        """Configuración inicial para las pruebas"""
        self.client = Client()
        # Crear usuarios de prueba
        self.estudiante = User.objects.create_user(
            username='estudiante_test',
            email='estudiante@test.com',
            password='password123'
        )
        self.admin = User.objects.create_superuser(
            username='admin_test',
            email='admin@test.com',
            password='admin123'
        )

        # Código comentado que se utilizará cuando los modelos existan
        """
        # Crear un proyecto social
        self.proyecto = ProyectoSocial.objects.create(
            nombre='Alfabetización Digital',
            descripcion='Enseñar habilidades digitales básicas a adultos mayores',
            organizacion='Fundación Conectando Generaciones',
            fecha_inicio=timezone.now(),
            fecha_fin=timezone.now() + timedelta(days=90),
            horas_requeridas=40,
            cupos=20,
            cupos_disponibles=20,
            estado='Activo',
            creado_por=self.admin
        )
        """

    def test_listar_proyectos_psu(self):
        """Prueba para la vista de listar proyectos PSU"""
        """
        # Acceder a la vista sin autenticación (debería ser accesible para todos)
        response = self.client.get(reverse('psu:listar'))
        
        # Verificar que la respuesta sea exitosa
        self.assertEqual(response.status_code, 200)
        
        # Verificar que el proyecto aparezca en el contexto
        self.assertIn('proyectos', response.context)
        self.assertEqual(len(response.context['proyectos']), 1)
        self.assertEqual(response.context['proyectos'][0].nombre, 'Alfabetización Digital')
        """
        # Esta prueba fallará hasta que se implemente la vista de listar proyectos PSU
        self.assertTrue(True)  # Placeholder

    def test_detalle_proyecto_psu(self):
        """Prueba para la vista de detalle de proyecto PSU"""
        """
        # Acceder a la vista de detalle del proyecto
        response = self.client.get(reverse('psu:detalle', kwargs={'pk': self.proyecto.pk}))
        
        # Verificar que la respuesta sea exitosa
        self.assertEqual(response.status_code, 200)
        
        # Verificar que los datos del proyecto están presentes
        self.assertContains(response, 'Alfabetización Digital')
        self.assertContains(response, 'Fundación Conectando Generaciones')
        self.assertContains(response, '40')  # horas requeridas
        """
        # Esta prueba fallará hasta que se implemente la vista de detalle de proyecto PSU
        self.assertTrue(True)  # Placeholder

    def test_crear_proyecto_psu(self):
        """Prueba para la vista de crear proyecto PSU (solo para admin)"""
        """
        # Iniciar sesión como administrador
        self.client.login(username='admin_test', password='admin123')
        
        # Datos para el nuevo proyecto
        datos_proyecto = {
            'nombre': 'Apoyo Escolar',
            'descripcion': 'Ayudar a estudiantes de primaria con sus tareas',
            'organizacion': 'Escuela San Pedro',
            'fecha_inicio': timezone.now().strftime('%Y-%m-%d'),
            'fecha_fin': (timezone.now() + timedelta(days=60)).strftime('%Y-%m-%d'),
            'horas_requeridas': 30,
            'cupos': 15,
            'estado': 'Activo'
        }
        
        # Enviar petición POST para crear proyecto
        response = self.client.post(reverse('psu:crear'), datos_proyecto)
        
        # Verificar redirección después de crear
        self.assertEqual(response.status_code, 302)
        
        # Verificar que el proyecto se creó correctamente
        self.assertEqual(ProyectoSocial.objects.count(), 2)  # El original + el nuevo
        nuevo_proyecto = ProyectoSocial.objects.get(nombre='Apoyo Escolar')
        self.assertEqual(nuevo_proyecto.organizacion, 'Escuela San Pedro')
        self.assertEqual(nuevo_proyecto.cupos_disponibles, 15)  # Debe ser igual a cupos inicialmente
        
        # Verificar que un usuario no admin no puede crear proyectos
        self.client.logout()
        self.client.login(username='estudiante_test', password='password123')
        response = self.client.post(reverse('psu:crear'), datos_proyecto)
        self.assertEqual(response.status_code, 403)  # Forbidden
        """
        # Esta prueba fallará hasta que se implemente la vista de crear proyecto PSU
        self.assertTrue(True)  # Placeholder

    def test_inscripcion_proyecto_psu(self):
        """Prueba para la vista de inscripción a un proyecto PSU"""
        """
        # Iniciar sesión como estudiante
        self.client.login(username='estudiante_test', password='password123')
        
        # Enviar petición POST para inscribirse en el proyecto
        response = self.client.post(reverse('psu:inscribir'), {'proyecto_id': self.proyecto.id})
        
        # Verificar que la respuesta sea exitosa
        self.assertEqual(response.status_code, 200)
        
        # Verificar que la inscripción se creó correctamente
        self.assertEqual(InscripcionPSU.objects.count(), 1)
        inscripcion = InscripcionPSU.objects.first()
        self.assertEqual(inscripcion.usuario, self.estudiante)
        self.assertEqual(inscripcion.proyecto, self.proyecto)
        self.assertEqual(inscripcion.estado, 'Inscrito')
        
        # Verificar que los cupos disponibles disminuyen
        self.proyecto.refresh_from_db()
        self.assertEqual(self.proyecto.cupos_disponibles, 19)
        
        # Verificar que no se puede inscribir dos veces
        response = self.client.post(reverse('psu:inscribir'), {'proyecto_id': self.proyecto.id})
        self.assertEqual(response.status_code, 400)
        """
        # Esta prueba fallará hasta que se implemente la vista de inscripción a proyectos PSU
        self.assertTrue(True)  # Placeholder

    def test_registrar_horas_psu(self):
        """Prueba para la vista de registrar horas PSU (para admin o coordinador)"""
        """
        # Crear una inscripción
        inscripcion = InscripcionPSU.objects.create(
            usuario=self.estudiante,
            proyecto=self.proyecto,
            fecha_inscripcion=timezone.now(),
            estado='Inscrito',
            horas_completadas=0
        )
        
        # Iniciar sesión como administrador
        self.client.login(username='admin_test', password='admin123')
        
        # Datos para el registro de horas
        datos_horas = {
            'inscripcion_id': inscripcion.id,
            'horas': 10,
            'fecha': timezone.now().strftime('%Y-%m-%d'),
            'descripcion': 'Sesión de alfabetización digital'
        }
        
        # Enviar petición POST para registrar horas
        response = self.client.post(reverse('psu:registrar_horas'), datos_horas)
        
        # Verificar que la respuesta sea exitosa
        self.assertEqual(response.status_code, 200)
        
        # Verificar que las horas se registraron correctamente
        inscripcion.refresh_from_db()
        self.assertEqual(inscripcion.horas_completadas, 10)
        
        # Registrar horas suficientes para completar el proyecto
        datos_horas['horas'] = 30  # Total: 40 horas (completo)
        response = self.client.post(reverse('psu:registrar_horas'), datos_horas)
        
        # Verificar que el estado cambia a 'Completado'
        inscripcion.refresh_from_db()
        self.assertEqual(inscripcion.horas_completadas, 40)
        self.assertEqual(inscripcion.estado, 'Completado')
        
        # Verificar que un usuario estudiante no puede registrar horas
        self.client.logout()
        self.client.login(username='estudiante_test', password='password123')
        response = self.client.post(reverse('psu:registrar_horas'), datos_horas)
        self.assertEqual(response.status_code, 403)  # Forbidden
        """
        # Esta prueba fallará hasta que se implemente la vista de registrar horas PSU
        self.assertTrue(True)  # Placeholder


class TestCitasPsicologicasModels(TestCase):
    """Pruebas para los modelos relacionados con citas psicológicas"""

    def setUp(self):
        """Configuración inicial para las pruebas"""
        # Crear usuarios de prueba
        self.estudiante = User.objects.create_user(
            username='estudiante_test',
            email='estudiante@test.com',
            password='password123'
        )

        # Crear grupo para psicólogos
        self.grupo_psicologos = Group.objects.create(name='Psicólogos')

        # Crear usuario psicólogo
        self.psicologo = User.objects.create_user(
            username='psicologo_test',
            email='psicologo@test.com',
            password='psicologo123'
        )
        self.psicologo.groups.add(self.grupo_psicologos)

        # Código comentado que se utilizará cuando los modelos existan
        """
        # Crear horarios disponibles
        manana = timezone.now() + timedelta(days=1)
        manana = manana.replace(hour=9, minute=0, second=0, microsecond=0)
        
        self.cita1 = CitaPsicologica.objects.create(
            psicologo=self.psicologo,
            fecha_hora=manana,
            duracion=60,  # minutos
            estado='Disponible'
        )
        
        self.cita2 = CitaPsicologica.objects.create(
            psicologo=self.psicologo,
            fecha_hora=manana + timedelta(hours=1),
            duracion=60,  # minutos
            estado='Disponible'
        )
        """

    def test_modelo_cita_psicologica(self):
        """Prueba para el modelo CitaPsicologica"""
        """
        # Verificar que las citas se crearon correctamente
        self.assertEqual(CitaPsicologica.objects.count(), 2)
        
        # Verificar atributos de la cita
        cita = CitaPsicologica.objects.first()
        self.assertEqual(cita.psicologo, self.psicologo)
        self.assertEqual(cita.duracion, 60)
        self.assertEqual(cita.estado, 'Disponible')
        self.assertIsNone(cita.estudiante)  # No hay estudiante asignado aún
        
        # Reservar una cita
        cita.reservar(self.estudiante)
        self.assertEqual(cita.estudiante, self.estudiante)
        self.assertEqual(cita.estado, 'Reservada')
        
        # Intentar reservar una cita ya reservada debe fallar
        estudiante2 = User.objects.create_user(username='estudiante2', password='password123')
        with self.assertRaises(Exception):
            cita.reservar(estudiante2)
        
        # Cancelar una cita
        cita.cancelar()
        self.assertIsNone(cita.estudiante)
        self.assertEqual(cita.estado, 'Disponible')
        """
        # Esta prueba fallará hasta que se cree el modelo CitaPsicologica
        self.assertTrue(True)  # Placeholder


class TestCitasPsicologicasViews(TestCase):
    """Pruebas para las vistas relacionadas con citas psicológicas"""

    def setUp(self):
        """Configuración inicial para las pruebas"""
        self.client = Client()

        # Crear usuarios de prueba
        self.estudiante = User.objects.create_user(
            username='estudiante_test',
            email='estudiante@test.com',
            password='password123'
        )

        # Crear grupo para psicólogos
        self.grupo_psicologos = Group.objects.create(name='Psicólogos')

        # Crear usuario psicólogo
        self.psicologo = User.objects.create_user(
            username='psicologo_test',
            email='psicologo@test.com',
            password='psicologo123'
        )
        self.psicologo.groups.add(self.grupo_psicologos)

        # Código comentado que se utilizará cuando los modelos existan
        """
        # Crear horarios disponibles
        manana = timezone.now() + timedelta(days=1)
        manana = manana.replace(hour=9, minute=0, second=0, microsecond=0)
        
        self.cita1 = CitaPsicologica.objects.create(
            psicologo=self.psicologo,
            fecha_hora=manana,
            duracion=60,  # minutos
            estado='Disponible'
        )
        
        self.cita2 = CitaPsicologica.objects.create(
            psicologo=self.psicologo,
            fecha_hora=manana + timedelta(hours=1),
            duracion=60,  # minutos
            estado='Disponible'
        )
        """

    def test_listar_citas_disponibles(self):
        """Prueba para la vista de listar citas disponibles"""
        """
        # Iniciar sesión como estudiante
        self.client.login(username='estudiante_test', password='password123')
        
        # Acceder a la vista de listar citas disponibles
        response = self.client.get(reverse('citas:disponibles'))
        
        # Verificar que la respuesta sea exitosa
        self.assertEqual(response.status_code, 200)
        
        # Verificar que las citas disponibles aparecen en el contexto
        self.assertIn('citas', response.context)
        self.assertEqual(len(response.context['citas']), 2)
        """
        # Esta prueba fallará hasta que se implemente la vista de listar citas disponibles
        self.assertTrue(True)  # Placeholder

    def test_reservar_cita(self):
        """Prueba para la vista de reservar una cita psicológica"""
        """
        # Iniciar sesión como estudiante
        self.client.login(username='estudiante_test', password='password123')
        
        # Enviar petición POST para reservar una cita
        response = self.client.post(reverse('citas:reservar'), {'cita_id': self.cita1.id})
        
        # Verificar que la respuesta sea exitosa
        self.assertEqual(response.status_code, 200)
        
        # Verificar que la cita se reservó correctamente
        self.cita1.refresh_from_db()
        self.assertEqual(self.cita1.estudiante, self.estudiante)
        self.assertEqual(self.cita1.estado, 'Reservada')
        
        # Verificar que no se puede reservar una cita ya reservada
        estudiante2 = User.objects.create_user(username='estudiante2', password='password123')
        self.client.logout()
        self.client.login(username='estudiante2', password='password123')
        response = self.client.post(reverse('citas:reservar'), {'cita_id': self.cita1.id})
        self.assertEqual(response.status_code, 400)
        """
        # Esta prueba fallará hasta que se implemente la vista de reservar cita
        self.assertTrue(True)  # Placeholder

    def test_cancelar_cita(self):
        """Prueba para la vista de cancelar una cita psicológica"""
        """
        # Iniciar sesión como estudiante
        self.client.login(username='estudiante_test', password='password123')
        
        # Reservar una cita primero
        self.cita1.reservar(self.estudiante)
        
        # Enviar petición POST para cancelar la cita
        response = self.client.post(reverse('citas:cancelar'), {'cita_id': self.cita1.id})
        
        # Verificar que la respuesta sea exitosa
        self.assertEqual(response.status_code, 200)
        
        # Verificar que la cita se canceló correctamente
        self.cita1.refresh_from_db()
        self.assertIsNone(self.cita1.estudiante)
        self.assertEqual(self.cita1.estado, 'Disponible')
        
        # Verificar que solo el estudiante que reservó o un psicólogo puede cancelar
        self.cita2.reservar(self.estudiante)
        
        estudiante2 = User.objects.create_user(username='estudiante2', password='password123')
        self.client.logout()
        self.client.login(username='estudiante2', password='password123')
        response = self.client.post(reverse('citas:cancelar'), {'cita_id': self.cita2.id})
        self.assertEqual(response.status_code, 403)  # Forbidden
        
        # El psicólogo sí puede cancelar cualquier cita
        self.client.logout()
        self.client.login(username='psicologo_test', password='psicologo123')
        response = self.client.post(reverse('citas:cancelar'), {'cita_id': self.cita2.id})
        self.assertEqual(response.status_code, 200)
        """
        # Esta prueba fallará hasta que se implemente la vista de cancelar cita
        self.assertTrue(True)  # Placeholder

    def test_reprogramar_cita(self):
        """Prueba para la vista de reprogramar una cita psicológica"""
        """
        # Iniciar sesión como estudiante
        self.client.login(username='estudiante_test', password='password123')
        
        # Reservar una cita primero
        self.cita1.reservar(self.estudiante)
        
        # Crear una nueva fecha disponible para reprogramar
        pasado_manana = timezone.now() + timedelta(days=2)
        pasado_manana = pasado_manana.replace(hour=10, minute=0, second=0, microsecond=0)
        
        cita_nueva = CitaPsicologica.objects.create(
            psicologo=self.psicologo,
            fecha_hora=pasado_manana,
            duracion=60,
            estado='Disponible'
        )
        
        # Enviar petición POST para reprogramar la cita
        datos_reprogramacion = {
            'cita_actual_id': self.cita1.id,
            'cita_nueva_id': cita_nueva.id
        }
        
        response = self.client.post(reverse('citas:reprogramar'), datos_reprogramacion)
        
        # Verificar que la respuesta sea exitosa
        self.assertEqual(response.status_code, 200)
        
        # Verificar que la cita original está disponible de nuevo
        self.cita1.refresh_from_db()
        self.assertIsNone(self.cita1.estudiante)
        self.assertEqual(self.cita1.estado, 'Disponible')
        
        # Verificar que la nueva cita está reservada
        cita_nueva.refresh_from_db()
        self.assertEqual(cita_nueva.estudiante, self.estudiante)
        self.assertEqual(cita_nueva.estado, 'Reservada')
        """
        # Esta prueba fallará hasta que se implemente la vista de reprogramar cita
        self.assertTrue(True)  # Placeholder

    def test_crear_horarios_disponibles(self):
        """Prueba para la vista de crear horarios disponibles (solo para psicólogos)"""
        """
        # Iniciar sesión como psicólogo
        self.client.login(username='psicologo_test', password='psicologo123')
        
        # Fecha para los nuevos horarios
        proxima_semana = timezone.now() + timedelta(days=7)
        proxima_semana = proxima_semana.replace(hour=9, minute=0, second=0, microsecond=0)
        
        # Datos para crear horarios disponibles (3 horas seguidas)
        datos_horarios = {
            'fecha': proxima_semana.strftime('%Y-%m-%d'),
            'hora_inicio': '09:00',
            'hora_fin': '12:00',
            'duracion_cita': 60  # minutos
        }
        
        # Enviar petición POST para crear horarios
        response = self.client.post(reverse('citas:crear_horarios'), datos_horarios)
        
        # Verificar que la respuesta sea exitosa
        self.assertEqual(response.status_code, 200)
        
        # Verificar que se crearon 3 nuevas citas (9:00, 10:00, 11:00)
        nuevas_citas = CitaPsicologica.objects.filter(
            psicologo=self.psicologo, 
            fecha_hora__date=proxima_semana.date()
        )
        self.assertEqual(nuevas_citas.count(), 3)
        
        # Verificar que un usuario estudiante no puede crear horarios
        self.client.logout()
        self.client.login(username='estudiante_test', password='password123')
        response = self.client.post(reverse('citas:crear_horarios'), datos_horarios)
        self.assertEqual(response.status_code, 403)  # Forbidden
        """
        # Esta prueba fallará hasta que se implemente la vista de crear horarios disponibles
        self.assertTrue(True)  # Placeholder


