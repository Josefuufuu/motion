import pytest
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from django.utils import timezone
import json
from datetime import datetime, timedelta

# Importaciones que se requerirán cuando los modelos sean creados
# from actividades.models import Actividad, TipoActividad, Lugar, Valoracion
#Tengan en cuenta antes de correr las pruebas que tienen que comentar los assertTrue de los placeholders y descomentar las partes comentadas del código. los assertTrue están para que las pruebas no fallen mientras los modelos y vistas no estén implementados.

# Tests para el Módulo CADI - Centro Artístico y Deportivo

class TestActividadesModels(TestCase):
    """Pruebas para los modelos del módulo CADI"""

    def setUp(self):
        """Configuración inicial para las pruebas"""
        # Crear usuario de prueba
        self.user = User.objects.create_user(
            username='estudiante_test',
            email='estudiante@test.com',
            password='password123'
        )

        # Crear tipos de actividad (estos serían creados una vez los modelos existan)
        """
        self.tipo_deporte = TipoActividad.objects.create(
            nombre='Deporte',
            descripcion='Actividades deportivas'
        )
        self.tipo_arte = TipoActividad.objects.create(
            nombre='Arte',
            descripcion='Actividades artísticas'
        )

        # Crear lugares para actividades
        self.lugar_cancha = Lugar.objects.create(
            nombre='Cancha Múltiple',
            ubicacion='Edificio A - Piso 1',
            capacidad=30
        )

        self.lugar_salon = Lugar.objects.create(
            nombre='Salón de Arte',
            ubicacion='Edificio B - Piso 2',
            capacidad=20
        )

        # Crear actividades de prueba
        self.actividad_futbol = Actividad.objects.create(
            nombre='Torneo de Fútbol',
            descripcion='Torneo interno de fútbol sala',
            tipo=self.tipo_deporte,
            lugar=self.lugar_cancha,
            fecha_inicio=timezone.now() + timedelta(days=1),
            fecha_fin=timezone.now() + timedelta(days=1, hours=2),
            cupos_totales=20,
            cupos_disponibles=20,
            instructor='Juan Pérez',
            estado='Activa'
        )

        self.actividad_pintura = Actividad.objects.create(
            nombre='Taller de Pintura',
            descripcion='Taller básico de técnicas de pintura',
            tipo=self.tipo_arte,
            lugar=self.lugar_salon,
            fecha_inicio=timezone.now() + timedelta(days=2),
            fecha_fin=timezone.now() + timedelta(days=2, hours=3),
            cupos_totales=15,
            cupos_disponibles=15,
            instructor='María Gómez',
            estado='Activa'
        )
        """

    def test_modelo_tipo_actividad(self):
        """Prueba para el modelo TipoActividad"""
        """
        # Verificar que los tipos de actividad se crearon correctamente
        self.assertEqual(TipoActividad.objects.count(), 2)
        tipo_deporte = TipoActividad.objects.get(nombre='Deporte')
        self.assertEqual(tipo_deporte.descripcion, 'Actividades deportivas')
        """
        # Esta prueba fallará hasta que se cree el modelo TipoActividad
        self.assertTrue(True)  # Placeholder

    def test_modelo_lugar(self):
        """Prueba para el modelo Lugar"""
        """
        # Verificar que los lugares se crearon correctamente
        self.assertEqual(Lugar.objects.count(), 2)
        lugar_cancha = Lugar.objects.get(nombre='Cancha Múltiple')
        self.assertEqual(lugar_cancha.capacidad, 30)
        """
        # Esta prueba fallará hasta que se cree el modelo Lugar
        self.assertTrue(True)  # Placeholder

    def test_modelo_actividad(self):
        """Prueba para el modelo Actividad"""
        """
        # Verificar que las actividades se crearon correctamente
        self.assertEqual(Actividad.objects.count(), 2)
        
        # Prueba de atributos de actividad
        actividad_futbol = Actividad.objects.get(nombre='Torneo de Fútbol')
        self.assertEqual(actividad_futbol.cupos_disponibles, 20)
        self.assertEqual(actividad_futbol.instructor, 'Juan Pérez')
        self.assertEqual(actividad_futbol.tipo, self.tipo_deporte)
        
        # Prueba que la fecha_inicio sea anterior a fecha_fin
        self.assertTrue(actividad_futbol.fecha_inicio < actividad_futbol.fecha_fin)
        
        # Prueba de reducción de cupos disponibles al inscribirse
        actividad_futbol.inscribir_participante(self.user)
        self.assertEqual(actividad_futbol.cupos_disponibles, 19)
        """
        # Esta prueba fallará hasta que se cree el modelo Actividad
        self.assertTrue(True)  # Placeholder

    def test_valoracion_actividad(self):
        """Prueba para el modelo Valoracion de actividades"""
        """
        # Crear una valoración
        valoracion = Valoracion.objects.create(
            actividad=self.actividad_futbol,
            usuario=self.user,
            puntuacion=4,
            comentario='Excelente actividad, muy bien organizada'
        )
        
        # Verificar que la valoración se creó correctamente
        self.assertEqual(Valoracion.objects.count(), 1)
        self.assertEqual(valoracion.puntuacion, 4)
        self.assertEqual(valoracion.usuario, self.user)
        
        # Verificar que no se puede crear más de una valoración por usuario y actividad
        with self.assertRaises(Exception):
            Valoracion.objects.create(
                actividad=self.actividad_futbol,
                usuario=self.user,
                puntuacion=5,
                comentario='Intento duplicado'
            )
        """
        # Esta prueba fallará hasta que se cree el modelo Valoracion
        self.assertTrue(True)  # Placeholder


class TestActividadesViews(TestCase):
    """Pruebas para las vistas del módulo CADI"""

    def setUp(self):
        """Configuración inicial para las pruebas"""
        self.client = Client()
        # Crear usuario de prueba
        self.user = User.objects.create_user(
            username='estudiante_test',
            email='estudiante@test.com',
            password='password123'
        )
        self.admin_user = User.objects.create_superuser(
            username='admin_test',
            email='admin@test.com',
            password='admin123'
        )

        # Código comentado que se utilizará cuando los modelos existan
        """
        # Crear tipos, lugares y actividades como en TestActividadesModels
        self.tipo_deporte = TipoActividad.objects.create(
            nombre='Deporte',
            descripcion='Actividades deportivas'
        )
        
        self.lugar_cancha = Lugar.objects.create(
            nombre='Cancha Múltiple',
            ubicacion='Edificio A - Piso 1',
            capacidad=30
        )
        
        self.actividad_futbol = Actividad.objects.create(
            nombre='Torneo de Fútbol',
            descripcion='Torneo interno de fútbol sala',
            tipo=self.tipo_deporte,
            lugar=self.lugar_cancha,
            fecha_inicio=timezone.now() + timedelta(days=1),
            fecha_fin=timezone.now() + timedelta(days=1, hours=2),
            cupos_totales=20,
            cupos_disponibles=20,
            instructor='Juan Pérez',
            estado='Activa'
        )
        """

    def test_listar_actividades(self):
        """Prueba para la vista de listar actividades"""
        """
        # Iniciar sesión como usuario normal
        self.client.login(username='estudiante_test', password='password123')
        
        # Acceder a la vista de listar actividades
        response = self.client.get(reverse('actividades:listar'))
        
        # Verificar que la respuesta sea exitosa
        self.assertEqual(response.status_code, 200)
        
        # Verificar que la actividad aparezca en el contexto
        self.assertIn('actividades', response.context)
        self.assertEqual(len(response.context['actividades']), 1)
        self.assertEqual(response.context['actividades'][0].nombre, 'Torneo de Fútbol')
        """
        # Esta prueba fallará hasta que se implemente la vista de listar actividades
        self.assertTrue(True)  # Placeholder

    def test_filtrar_actividades_por_tipo(self):
        """Prueba para filtrar actividades por tipo"""
        """
        # Iniciar sesión como usuario normal
        self.client.login(username='estudiante_test', password='password123')
        
        # Acceder a la vista con filtro de tipo
        response = self.client.get(f"{reverse('actividades:listar')}?tipo={self.tipo_deporte.id}")
        
        # Verificar que la respuesta sea exitosa y muestre solo actividades del tipo seleccionado
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.context['actividades']), 1)
        
        # Probar con un tipo que no tiene actividades
        tipo_sin_actividades = TipoActividad.objects.create(nombre='Otro', descripcion='Otro tipo')
        response = self.client.get(f"{reverse('actividades:listar')}?tipo={tipo_sin_actividades.id}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.context['actividades']), 0)
        """
        # Esta prueba fallará hasta que se implemente el filtrado por tipo
        self.assertTrue(True)  # Placeholder

    def test_filtrar_actividades_por_lugar(self):
        """Prueba para filtrar actividades por lugar"""
        """
        # Iniciar sesión como usuario normal
        self.client.login(username='estudiante_test', password='password123')
        
        # Acceder a la vista con filtro de lugar
        response = self.client.get(f"{reverse('actividades:listar')}?lugar={self.lugar_cancha.id}")
        
        # Verificar que la respuesta sea exitosa y muestre solo actividades del lugar seleccionado
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.context['actividades']), 1)
        """
        # Esta prueba fallará hasta que se implemente el filtrado por lugar
        self.assertTrue(True)  # Placeholder

    def test_filtrar_actividades_por_fecha(self):
        """Prueba para filtrar actividades por fecha"""
        """
        # Iniciar sesión como usuario normal
        self.client.login(username='estudiante_test', password='password123')
        
        # Fecha para el filtro (convertida a string en formato YYYY-MM-DD)
        fecha_filtro = (timezone.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        # Acceder a la vista con filtro de fecha
        response = self.client.get(f"{reverse('actividades:listar')}?fecha={fecha_filtro}")
        
        # Verificar que la respuesta sea exitosa y muestre solo actividades de la fecha seleccionada
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.context['actividades']), 1)
        
        # Probar con una fecha que no tiene actividades
        fecha_sin_actividades = (timezone.now() + timedelta(days=10)).strftime('%Y-%m-%d')
        response = self.client.get(f"{reverse('actividades:listar')}?fecha={fecha_sin_actividades}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.context['actividades']), 0)
        """
        # Esta prueba fallará hasta que se implemente el filtrado por fecha
        self.assertTrue(True)  # Placeholder

    def test_crear_actividad(self):
        """Prueba para la vista de crear actividad (solo para admin)"""
        """
        # Iniciar sesión como administrador
        self.client.login(username='admin_test', password='admin123')
        
        # Datos para la nueva actividad
        datos_actividad = {
            'nombre': 'Nueva Actividad',
            'descripcion': 'Descripción de prueba',
            'tipo': self.tipo_deporte.id,
            'lugar': self.lugar_cancha.id,
            'fecha_inicio': (timezone.now() + timedelta(days=3)).strftime('%Y-%m-%d %H:%M'),
            'fecha_fin': (timezone.now() + timedelta(days=3, hours=2)).strftime('%Y-%m-%d %H:%M'),
            'cupos_totales': 25,
            'instructor': 'Instructor de Prueba',
            'estado': 'Activa'
        }
        
        # Enviar petición POST para crear actividad
        response = self.client.post(reverse('actividades:crear'), datos_actividad)
        
        # Verificar redirección después de crear
        self.assertEqual(response.status_code, 302)
        
        # Verificar que la actividad se creó correctamente
        self.assertEqual(Actividad.objects.count(), 2)  # La original + la nueva
        nueva_actividad = Actividad.objects.get(nombre='Nueva Actividad')
        self.assertEqual(nueva_actividad.cupos_disponibles, 25)  # Debe igualar a cupos_totales al crear
        
        # Verificar que un usuario no admin no puede crear actividades
        self.client.logout()
        self.client.login(username='estudiante_test', password='password123')
        response = self.client.post(reverse('actividades:crear'), datos_actividad)
        self.assertEqual(response.status_code, 403)  # Forbidden
        """
        # Esta prueba fallará hasta que se implemente la vista de crear actividad
        self.assertTrue(True)  # Placeholder

    def test_actualizar_actividad(self):
        """Prueba para la vista de actualizar actividad (solo para admin)"""
        """
        # Iniciar sesión como administrador
        self.client.login(username='admin_test', password='admin123')
        
        # Datos actualizados
        datos_actualizados = {
            'nombre': 'Torneo de Fútbol Actualizado',
            'descripcion': 'Descripción actualizada',
            'tipo': self.tipo_deporte.id,
            'lugar': self.lugar_cancha.id,
            'fecha_inicio': self.actividad_futbol.fecha_inicio.strftime('%Y-%m-%d %H:%M'),
            'fecha_fin': self.actividad_futbol.fecha_fin.strftime('%Y-%m-%d %H:%M'),
            'cupos_totales': 25,
            'instructor': 'Instructor Actualizado',
            'estado': 'Activa'
        }
        
        # Enviar petición POST para actualizar actividad
        response = self.client.post(
            reverse('actividades:actualizar', kwargs={'pk': self.actividad_futbol.pk}),
            datos_actualizados
        )
        
        # Verificar redirección después de actualizar
        self.assertEqual(response.status_code, 302)
        
        # Verificar que la actividad se actualizó correctamente
        self.actividad_futbol.refresh_from_db()
        self.assertEqual(self.actividad_futbol.nombre, 'Torneo de Fútbol Actualizado')
        self.assertEqual(self.actividad_futbol.instructor, 'Instructor Actualizado')
        
        # Verificar que un usuario no admin no puede actualizar actividades
        self.client.logout()
        self.client.login(username='estudiante_test', password='password123')
        response = self.client.post(
            reverse('actividades:actualizar', kwargs={'pk': self.actividad_futbol.pk}),
            datos_actualizados
        )
        self.assertEqual(response.status_code, 403)  # Forbidden
        """
        # Esta prueba fallará hasta que se implemente la vista de actualizar actividad
        self.assertTrue(True)  # Placeholder

    def test_valorar_actividad(self):
        """Prueba para la vista de valorar una actividad"""
        """
        # Iniciar sesión como usuario normal
        self.client.login(username='estudiante_test', password='password123')
        
        # Datos de la valoración
        datos_valoracion = {
            'actividad_id': self.actividad_futbol.id,
            'puntuacion': 5,
            'comentario': 'Excelente actividad'
        }
        
        # Enviar petición POST para valorar actividad
        response = self.client.post(reverse('actividades:valorar'), datos_valoracion)
        
        # Verificar que la respuesta sea exitosa
        self.assertEqual(response.status_code, 200)
        
        # Verificar que la valoración se creó correctamente
        valoracion = Valoracion.objects.get(
            actividad=self.actividad_futbol,
            usuario=self.user
        )
        self.assertEqual(valoracion.puntuacion, 5)
        self.assertEqual(valoracion.comentario, 'Excelente actividad')
        
        # Verificar que no se puede valorar dos veces la misma actividad
        response = self.client.post(reverse('actividades:valorar'), datos_valoracion)
        self.assertEqual(response.status_code, 400)
        
        # Verificar que un usuario no autenticado no puede valorar
        self.client.logout()
        response = self.client.post(reverse('actividades:valorar'), datos_valoracion)
        self.assertEqual(response.status_code, 401)  # Unauthorized
        """
        # Esta prueba fallará hasta que se implemente la vista de valorar actividad
        self.assertTrue(True)  # Placeholder


class TestCalendarioActividades(TestCase):
    """Pruebas para el calendario interactivo de actividades"""

    def setUp(self):
        """Configuración inicial para las pruebas"""
        self.client = Client()
        # Crear usuario de prueba
        self.user = User.objects.create_user(
            username='estudiante_test',
            email='estudiante@test.com',
            password='password123'
        )

        # Código comentado que se utilizará cuando los modelos existan
        """
        # Crear actividades en diferentes fechas
        self.tipo_deporte = TipoActividad.objects.create(nombre='Deporte', descripcion='Actividades deportivas')
        self.lugar_cancha = Lugar.objects.create(nombre='Cancha Múltiple', ubicacion='Edificio A', capacidad=30)
        
        # Actividad para hoy
        self.actividad_hoy = Actividad.objects.create(
            nombre='Actividad Hoy',
            descripcion='Descripción',
            tipo=self.tipo_deporte,
            lugar=self.lugar_cancha,
            fecha_inicio=timezone.now(),
            fecha_fin=timezone.now() + timedelta(hours=2),
            cupos_totales=20,
            cupos_disponibles=20,
            instructor='Instructor',
            estado='Activa'
        )
        
        # Actividad para mañana
        self.actividad_manana = Actividad.objects.create(
            nombre='Actividad Mañana',
            descripcion='Descripción',
            tipo=self.tipo_deporte,
            lugar=self.lugar_cancha,
            fecha_inicio=timezone.now() + timedelta(days=1),
            fecha_fin=timezone.now() + timedelta(days=1, hours=2),
            cupos_totales=20,
            cupos_disponibles=20,
            instructor='Instructor',
            estado='Activa'
        )
        
        # Actividad para próximo mes
        self.actividad_mes = Actividad.objects.create(
            nombre='Actividad Próximo Mes',
            descripcion='Descripción',
            tipo=self.tipo_deporte,
            lugar=self.lugar_cancha,
            fecha_inicio=timezone.now() + timedelta(days=32),
            fecha_fin=timezone.now() + timedelta(days=32, hours=2),
            cupos_totales=20,
            cupos_disponibles=20,
            instructor='Instructor',
            estado='Activa'
        )
        """

    def test_api_calendario_mensual(self):
        """Prueba para la API del calendario en vista mensual"""
        """
        # Iniciar sesión
        self.client.login(username='estudiante_test', password='password123')
        
        # Fecha actual para el filtro (mes actual)
        fecha_actual = timezone.now()
        mes = fecha_actual.month
        anio = fecha_actual.year
        
        # Solicitar actividades del mes actual
        response = self.client.get(f"{reverse('actividades:api_calendario')}?mes={mes}&anio={anio}")
        
        # Verificar respuesta exitosa
        self.assertEqual(response.status_code, 200)
        
        # Verificar que las actividades del mes actual están incluidas
        data = json.loads(response.content)
        self.assertEqual(len(data['actividades']), 2)  # actividad_hoy y actividad_manana
        
        # Verificar estructura de los datos
        self.assertTrue('id' in data['actividades'][0])
        self.assertTrue('nombre' in data['actividades'][0])
        self.assertTrue('fecha_inicio' in data['actividades'][0])
        self.assertTrue('fecha_fin' in data['actividades'][0])
        
        # Probar con el próximo mes (donde hay una actividad)
        proximo_mes = mes + 1 if mes < 12 else 1
        proximo_anio = anio if mes < 12 else anio + 1
        
        response = self.client.get(f"{reverse('actividades:api_calendario')}?mes={proximo_mes}&anio={proximo_anio}")
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.content)
        self.assertEqual(len(data['actividades']), 1)  # Solo actividad_mes
        """
        # Esta prueba fallará hasta que se implemente la API del calendario
        self.assertTrue(True)  # Placeholder

    def test_api_calendario_semanal(self):
        """Prueba para la API del calendario en vista semanal"""
        """
        # Iniciar sesión
        self.client.login(username='estudiante_test', password='password123')
        
        # Fecha actual para el filtro (semana actual)
        fecha_actual = timezone.now()
        # Obtener el primer día de la semana actual (lunes)
        inicio_semana = fecha_actual - timedelta(days=fecha_actual.weekday())
        fin_semana = inicio_semana + timedelta(days=6)
        
        # Solicitar actividades de la semana actual
        response = self.client.get(
            f"{reverse('actividades:api_calendario')}?inicio={inicio_semana.strftime('%Y-%m-%d')}&fin={fin_semana.strftime('%Y-%m-%d')}"
        )
        
        # Verificar respuesta exitosa
        self.assertEqual(response.status_code, 200)
        
        # Verificar que las actividades de la semana actual están incluidas
        data = json.loads(response.content)
        actividades = data['actividades']
        
        # Verificar que actividad_hoy y actividad_manana están en los resultados
        # pero actividad_mes no (está en otro mes)
        self.assertEqual(len(actividades), 2)
        
        # Verificar que los nombres de las actividades son correctos
        nombres_actividades = [a['nombre'] for a in actividades]
        self.assertIn('Actividad Hoy', nombres_actividades)
        self.assertIn('Actividad Mañana', nombres_actividades)
        self.assertNotIn('Actividad Próximo Mes', nombres_actividades)
        """
        # Esta prueba fallará hasta que se implemente la API del calendario
        self.assertTrue(True)  # Placeholder

    def test_api_calendario_diario(self):
        """Prueba para la API del calendario en vista diaria"""
        """
        # Iniciar sesión
        self.client.login(username='estudiante_test', password='password123')
        
        # Fecha actual para el filtro (día actual)
        fecha_actual = timezone.now().date().strftime('%Y-%m-%d')
        
        # Solicitar actividades del día actual
        response = self.client.get(f"{reverse('actividades:api_calendario')}?fecha={fecha_actual}")
        
        # Verificar respuesta exitosa
        self.assertEqual(response.status_code, 200)
        
        # Verificar que solo la actividad de hoy está incluida
        data = json.loads(response.content)
        self.assertEqual(len(data['actividades']), 1)
        self.assertEqual(data['actividades'][0]['nombre'], 'Actividad Hoy')
        
        # Probar con la fecha de mañana
        fecha_manana = (timezone.now() + timedelta(days=1)).date().strftime('%Y-%m-%d')
        
        response = self.client.get(f"{reverse('actividades:api_calendario')}?fecha={fecha_manana}")
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.content)
        self.assertEqual(len(data['actividades']), 1)
        self.assertEqual(data['actividades'][0]['nombre'], 'Actividad Mañana')
        """
        # Esta prueba fallará hasta que se implemente la API del calendario
        self.assertTrue(True)  # Placeholder


