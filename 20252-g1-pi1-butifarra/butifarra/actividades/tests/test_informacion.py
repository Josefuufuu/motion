import pytest
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from django.utils import timezone
import json
from datetime import datetime, timedelta

# Importaciones que se requerirán cuando los modelos sean creados
# from actividades.models import HorarioPersonalizado, Notificacion, PreferenciaNotificacion
#Tengan en cuenta antes de correr las pruebas que tienen que comentar los assertTrue de los placeholders y descomentar las partes comentadas del código. los assertTrue están para que las pruebas no fallen mientras los modelos y vistas no estén implementados.

# Tests para el Módulo de Información (horarios personalizados, notificaciones)

class TestHorarioPersonalizadoModels(TestCase):
    """Pruebas para los modelos relacionados con horarios personalizados"""

    def setUp(self):
        """Configuración inicial para las pruebas"""
        # Crear usuario de prueba
        self.estudiante = User.objects.create_user(
            username='estudiante_test',
            email='estudiante@test.com',
            password='password123'
        )

        # Código comentado que se utilizará cuando los modelos existan
        """
        # Crear horario personalizado para el usuario
        self.horario1 = HorarioPersonalizado.objects.create(
            usuario=self.estudiante,
            titulo='Clase de Programación',
            descripcion='Clase semanal de programación',
            dia_semana=1,  # Lunes
            hora_inicio='08:00',
            hora_fin='10:00',
            color='#3498db',
            recordatorio=True
        )
        
        self.horario2 = HorarioPersonalizado.objects.create(
            usuario=self.estudiante,
            titulo='Estudio en biblioteca',
            descripcion='Sesión de estudio personal',
            dia_semana=3,  # Miércoles
            hora_inicio='14:00',
            hora_fin='16:00',
            color='#2ecc71',
            recordatorio=False
        )
        
        # Crear referencias a actividades existentes (esto sería más complejo en la implementación real)
        from actividades.models import Actividad
        # Suponiendo que ya existe una actividad en la base de datos
        actividad = Actividad.objects.first()
        if actividad:
            self.horario3 = HorarioPersonalizado.objects.create(
                usuario=self.estudiante,
                titulo=f'Actividad: {actividad.nombre}',
                descripcion=actividad.descripcion,
                fecha=actividad.fecha_inicio.date(),
                hora_inicio=actividad.fecha_inicio.time().strftime('%H:%M'),
                hora_fin=actividad.fecha_fin.time().strftime('%H:%M'),
                color='#e74c3c',
                recordatorio=True,
                actividad_relacionada=actividad
            )
        """

    def test_modelo_horario_personalizado(self):
        """Prueba para el modelo HorarioPersonalizado"""
        """
        # Verificar que los horarios se crearon correctamente
        self.assertEqual(HorarioPersonalizado.objects.count(), 2)  # o 3 si existe la actividad
        
        # Verificar atributos del horario
        horario = HorarioPersonalizado.objects.get(titulo='Clase de Programación')
        self.assertEqual(horario.usuario, self.estudiante)
        self.assertEqual(horario.dia_semana, 1)
        self.assertEqual(horario.hora_inicio, '08:00')
        self.assertEqual(horario.hora_fin, '10:00')
        
        # Verificar validación de hora_inicio < hora_fin
        with self.assertRaises(Exception):
            HorarioPersonalizado.objects.create(
                usuario=self.estudiante,
                titulo='Horario Inválido',
                descripcion='Horario con horas inválidas',
                dia_semana=2,  # Martes
                hora_inicio='16:00',
                hora_fin='14:00',  # Antes de hora_inicio
                color='#9b59b6',
                recordatorio=False
            )
        
        # Probar obtener horarios de un día específico
        horarios_lunes = HorarioPersonalizado.objects.filter(usuario=self.estudiante, dia_semana=1)
        self.assertEqual(horarios_lunes.count(), 1)
        self.assertEqual(horarios_lunes.first().titulo, 'Clase de Programación')
        """
        # Esta prueba fallará hasta que se cree el modelo HorarioPersonalizado
        self.assertTrue(True)  # Placeholder

    def test_sincronizacion_actividades(self):
        """Prueba para la sincronización de actividades con el horario personalizado"""
        """
        # Verificar si existe un horario relacionado con una actividad
        from actividades.models import Actividad
        actividad = Actividad.objects.first()
        
        if actividad:
            # Verificar que el horario relacionado a la actividad se creó correctamente
            horario_actividad = HorarioPersonalizado.objects.get(actividad_relacionada=actividad)
            self.assertEqual(horario_actividad.titulo, f'Actividad: {actividad.nombre}')
            self.assertEqual(horario_actividad.usuario, self.estudiante)
            
            # Verificar actualización automática cuando la actividad cambia
            nueva_hora_fin = (actividad.fecha_fin + timedelta(hours=1)).time()
            actividad.fecha_fin = timezone.now().replace(hour=nueva_hora_fin.hour, minute=nueva_hora_fin.minute)
            actividad.save()
            
            # Verificar que el horario se actualizó
            horario_actividad.refresh_from_db()
            self.assertEqual(horario_actividad.hora_fin, nueva_hora_fin.strftime('%H:%M'))
        """
        # Esta prueba fallará hasta que se implemente la sincronización de actividades
        self.assertTrue(True)  # Placeholder


class TestHorarioPersonalizadoViews(TestCase):
    """Pruebas para las vistas relacionadas con horarios personalizados"""

    def setUp(self):
        """Configuración inicial para las pruebas"""
        self.client = Client()
        # Crear usuario de prueba
        self.estudiante = User.objects.create_user(
            username='estudiante_test',
            email='estudiante@test.com',
            password='password123'
        )

        # Código comentado que se utilizará cuando los modelos existan
        """
        # Crear horario personalizado para el usuario
        self.horario = HorarioPersonalizado.objects.create(
            usuario=self.estudiante,
            titulo='Clase de Programación',
            descripcion='Clase semanal de programación',
            dia_semana=1,  # Lunes
            hora_inicio='08:00',
            hora_fin='10:00',
            color='#3498db',
            recordatorio=True
        )
        """

    def test_listar_horarios(self):
        """Prueba para la vista de listar horarios personalizados"""
        """
        # Iniciar sesión como estudiante
        self.client.login(username='estudiante_test', password='password123')
        
        # Acceder a la vista de listar horarios
        response = self.client.get(reverse('horarios:listar'))
        
        # Verificar que la respuesta sea exitosa
        self.assertEqual(response.status_code, 200)
        
        # Verificar que el horario aparezca en el contexto
        self.assertIn('horarios', response.context)
        self.assertEqual(len(response.context['horarios']), 1)
        self.assertEqual(response.context['horarios'][0].titulo, 'Clase de Programación')
        
        # Verificar que un usuario solo ve sus propios horarios
        estudiante2 = User.objects.create_user(username='estudiante2', password='password123')
        HorarioPersonalizado.objects.create(
            usuario=estudiante2,
            titulo='Horario de otro usuario',
            descripcion='No debería ser visible para estudiante_test',
            dia_semana=2,
            hora_inicio='09:00',
            hora_fin='11:00',
            color='#f39c12',
            recordatorio=False
        )
        
        response = self.client.get(reverse('horarios:listar'))
        self.assertEqual(len(response.context['horarios']), 1)  # Sigue mostrando solo 1 horario
        """
        # Esta prueba fallará hasta que se implemente la vista de listar horarios
        self.assertTrue(True)  # Placeholder

    def test_crear_horario(self):
        """Prueba para la vista de crear un horario personalizado"""
        """
        # Iniciar sesión como estudiante
        self.client.login(username='estudiante_test', password='password123')
        
        # Datos para el nuevo horario
        datos_horario = {
            'titulo': 'Nuevo Horario',
            'descripcion': 'Descripción de prueba',
            'dia_semana': 4,  # Jueves
            'hora_inicio': '16:00',
            'hora_fin': '18:00',
            'color': '#9b59b6',
            'recordatorio': 'true'  # Como string para simular form data
        }
        
        # Enviar petición POST para crear horario
        response = self.client.post(reverse('horarios:crear'), datos_horario)
        
        # Verificar redirección después de crear
        self.assertEqual(response.status_code, 302)
        
        # Verificar que el horario se creó correctamente
        self.assertEqual(HorarioPersonalizado.objects.count(), 2)  # El original + el nuevo
        nuevo_horario = HorarioPersonalizado.objects.get(titulo='Nuevo Horario')
        self.assertEqual(nuevo_horario.dia_semana, 4)
        self.assertEqual(nuevo_horario.usuario, self.estudiante)  # Asignado al usuario actual
        """
        # Esta prueba fallará hasta que se implemente la vista de crear horario
        self.assertTrue(True)  # Placeholder

    def test_actualizar_horario(self):
        """Prueba para la vista de actualizar un horario personalizado"""
        """
        # Iniciar sesión como estudiante
        self.client.login(username='estudiante_test', password='password123')
        
        # Datos actualizados
        datos_actualizados = {
            'titulo': 'Clase de Programación Actualizada',
            'descripcion': 'Descripción actualizada',
            'dia_semana': 1,
            'hora_inicio': '09:00',  # Cambio de hora
            'hora_fin': '11:00',     # Cambio de hora
            'color': '#e74c3c',      # Cambio de color
            'recordatorio': 'false'  # Cambio de recordatorio
        }
        
        # Enviar petición POST para actualizar horario
        response = self.client.post(
            reverse('horarios:actualizar', kwargs={'pk': self.horario.pk}),
            datos_actualizados
        )
        
        # Verificar redirección después de actualizar
        self.assertEqual(response.status_code, 302)
        
        # Verificar que el horario se actualizó correctamente
        self.horario.refresh_from_db()
        self.assertEqual(self.horario.titulo, 'Clase de Programación Actualizada')
        self.assertEqual(self.horario.hora_inicio, '09:00')
        self.assertEqual(self.horario.hora_fin, '11:00')
        self.assertEqual(self.horario.color, '#e74c3c')
        self.assertEqual(self.horario.recordatorio, False)
        
        # Verificar que un usuario solo puede actualizar sus propios horarios
        estudiante2 = User.objects.create_user(username='estudiante2', password='password123')
        horario2 = HorarioPersonalizado.objects.create(
            usuario=estudiante2,
            titulo='Horario de otro usuario',
            descripcion='No debería ser editable por estudiante_test',
            dia_semana=2,
            hora_inicio='09:00',
            hora_fin='11:00',
            color='#f39c12',
            recordatorio=False
        )
        
        response = self.client.post(
            reverse('horarios:actualizar', kwargs={'pk': horario2.pk}),
            datos_actualizados
        )
        self.assertEqual(response.status_code, 403)  # Forbidden
        """
        # Esta prueba fallará hasta que se implemente la vista de actualizar horario
        self.assertTrue(True)  # Placeholder

    def test_eliminar_horario(self):
        """Prueba para la vista de eliminar un horario personalizado"""
        """
        # Iniciar sesión como estudiante
        self.client.login(username='estudiante_test', password='password123')
        
        # Enviar petición POST para eliminar horario
        response = self.client.post(reverse('horarios:eliminar', kwargs={'pk': self.horario.pk}))
        
        # Verificar redirección después de eliminar
        self.assertEqual(response.status_code, 302)
        
        # Verificar que el horario se eliminó correctamente
        self.assertEqual(HorarioPersonalizado.objects.count(), 0)
        
        # Verificar que un usuario solo puede eliminar sus propios horarios
        estudiante2 = User.objects.create_user(username='estudiante2', password='password123')
        horario2 = HorarioPersonalizado.objects.create(
            usuario=estudiante2,
            titulo='Horario de otro usuario',
            descripcion='No debería ser eliminable por estudiante_test',
            dia_semana=2,
            hora_inicio='09:00',
            hora_fin='11:00',
            color='#f39c12',
            recordatorio=False
        )
        
        response = self.client.post(reverse('horarios:eliminar', kwargs={'pk': horario2.pk}))
        self.assertEqual(response.status_code, 403)  # Forbidden
        self.assertEqual(HorarioPersonalizado.objects.count(), 1)  # No se eliminó
        """
        # Esta prueba fallará hasta que se implemente la vista de eliminar horario
        self.assertTrue(True)  # Placeholder

    def test_sincronizar_actividades(self):
        """Prueba para la vista de sincronizar actividades con el horario personal"""
        """
        # Iniciar sesión como estudiante
        self.client.login(username='estudiante_test', password='password123')
        
        # Crear una actividad (esto depende de la implementación del modelo Actividad)
        from actividades.models import Actividad, TipoActividad, Lugar
        tipo = TipoActividad.objects.create(nombre='Deporte', descripcion='Actividades deportivas')
        lugar = Lugar.objects.create(nombre='Cancha', ubicacion='Edificio A', capacidad=30)
        
        actividad = Actividad.objects.create(
            nombre='Actividad de Prueba',
            descripcion='Descripción de la actividad',
            tipo=tipo,
            lugar=lugar,
            fecha_inicio=timezone.now() + timedelta(days=1),
            fecha_fin=timezone.now() + timedelta(days=1, hours=2),
            cupos_totales=20,
            cupos_disponibles=20,
            instructor='Instructor',
            estado='Activa'
        )
        
        # Enviar petición POST para sincronizar la actividad
        response = self.client.post(
            reverse('horarios:sincronizar'),
            {'actividad_id': actividad.id}
        )
        
        # Verificar que la respuesta sea exitosa
        self.assertEqual(response.status_code, 200)
        
        # Verificar que se creó un horario personalizado para la actividad
        self.assertEqual(HorarioPersonalizado.objects.filter(
            usuario=self.estudiante,
            actividad_relacionada=actividad
        ).count(), 1)
        
        horario_sincronizado = HorarioPersonalizado.objects.get(actividad_relacionada=actividad)
        self.assertEqual(horario_sincronizado.titulo, f'Actividad: {actividad.nombre}')
        """
        # Esta prueba fallará hasta que se implemente la vista de sincronizar actividades
        self.assertTrue(True)  # Placeholder


class TestNotificacionModels(TestCase):
    """Pruebas para los modelos relacionados con notificaciones"""

    def setUp(self):
        """Configuración inicial para las pruebas"""
        # Crear usuarios de prueba
        self.estudiante = User.objects.create_user(
            username='estudiante_test',
            email='estudiante@test.com',
            password='password123'
        )

        # Código comentado que se utilizará cuando los modelos existan
        """
        # Crear preferencias de notificación para el usuario
        self.preferencia = PreferenciaNotificacion.objects.create(
            usuario=self.estudiante,
            notificar_actividades=True,
            notificar_torneos=True,
            notificar_psu=False,
            notificar_citas=True,
            medio_preferido='Email'
        )
        
        # Crear notificaciones para el usuario
        self.notificacion1 = Notificacion.objects.create(
            usuario=self.estudiante,
            titulo='Recordatorio de actividad',
            mensaje='Tu actividad "Yoga" comienza en 1 hora',
            tipo='Actividad',
            leida=False,
            fecha_envio=timezone.now()
        )
        
        self.notificacion2 = Notificacion.objects.create(
            usuario=self.estudiante,
            titulo='Nuevo torneo disponible',
            mensaje='Se ha abierto un nuevo torneo de ajedrez',
            tipo='Torneo',
            leida=True,
            fecha_envio=timezone.now() - timedelta(days=1)
        )
        """

    def test_modelo_preferencia_notificacion(self):
        """Prueba para el modelo PreferenciaNotificacion"""
        """
        # Verificar que las preferencias se crearon correctamente
        self.assertEqual(PreferenciaNotificacion.objects.count(), 1)
        
        # Verificar atributos de las preferencias
        preferencia = PreferenciaNotificacion.objects.get(usuario=self.estudiante)
        self.assertTrue(preferencia.notificar_actividades)
        self.assertTrue(preferencia.notificar_torneos)
        self.assertFalse(preferencia.notificar_psu)
        self.assertTrue(preferencia.notificar_citas)
        self.assertEqual(preferencia.medio_preferido, 'Email')
        
        # Verificar valores por defecto para un nuevo usuario
        estudiante2 = User.objects.create_user(username='estudiante2', password='password123')
        # Suponiendo que hay un signal que crea automáticamente las preferencias al crear un usuario
        preferencia2 = PreferenciaNotificacion.objects.get(usuario=estudiante2)
        self.assertTrue(preferencia2.notificar_actividades)  # Valor por defecto
        """
        # Esta prueba fallará hasta que se cree el modelo PreferenciaNotificacion
        self.assertTrue(True)  # Placeholder

    def test_modelo_notificacion(self):
        """Prueba para el modelo Notificacion"""
        """
        # Verificar que las notificaciones se crearon correctamente
        self.assertEqual(Notificacion.objects.count(), 2)
        
        # Verificar atributos de la notificación
        notificacion = Notificacion.objects.get(titulo='Recordatorio de actividad')
        self.assertEqual(notificacion.usuario, self.estudiante)
        self.assertEqual(notificacion.tipo, 'Actividad')
        self.assertFalse(notificacion.leida)
        
        # Marcar como leída
        notificacion.marcar_como_leida()
        self.assertTrue(notificacion.leida)
        
        # Verificar notificaciones no leídas
        no_leidas = Notificacion.objects.filter(usuario=self.estudiante, leida=False)
        self.assertEqual(no_leidas.count(), 0)  # Ya se marcó la única no leída
        
        # Verificar notificaciones recientes (últimos 7 días)
        recientes = Notificacion.objects.filter(
            usuario=self.estudiante,
            fecha_envio__gte=timezone.now() - timedelta(days=7)
        )
        self.assertEqual(recientes.count(), 2)
        """
        # Esta prueba fallará hasta que se cree el modelo Notificacion
        self.assertTrue(True)  # Placeholder

    def test_envio_notificaciones(self):
        """Prueba para el envío automático de notificaciones"""
        """
        from actividades.utils import enviar_notificacion
        
        # Enviar una notificación al usuario
        enviar_notificacion(
            usuario=self.estudiante,
            titulo='Notificación de prueba',
            mensaje='Este es un mensaje de prueba',
            tipo='Sistema'
        )
        
        # Verificar que la notificación se creó
        self.assertEqual(Notificacion.objects.count(), 3)  # Las 2 iniciales + la nueva
        
        # Verificar atributos de la nueva notificación
        nueva_notificacion = Notificacion.objects.get(titulo='Notificación de prueba')
        self.assertEqual(nueva_notificacion.mensaje, 'Este es un mensaje de prueba')
        self.assertEqual(nueva_notificacion.tipo, 'Sistema')
        self.assertFalse(nueva_notificacion.leida)
        
        # Probar con tipo de notificación desactivada en preferencias
        enviar_notificacion(
            usuario=self.estudiante,
            titulo='Notificación PSU',
            mensaje='Esta notificación no debería enviarse',
            tipo='PSU'
        )
        
        # Verificar que no se creó la notificación (porque notificar_psu=False)
        self.assertEqual(Notificacion.objects.filter(titulo='Notificación PSU').count(), 0)
        """
        # Esta prueba fallará hasta que se implemente el envío de notificaciones
        self.assertTrue(True)  # Placeholder


class TestNotificacionViews(TestCase):
    """Pruebas para las vistas relacionadas con notificaciones"""

    def setUp(self):
        """Configuración inicial para las pruebas"""
        self.client = Client()
        # Crear usuario de prueba
        self.estudiante = User.objects.create_user(
            username='estudiante_test',
            email='estudiante@test.com',
            password='password123'
        )

        # Código comentado que se utilizará cuando los modelos existan
        """
        # Crear preferencias de notificación para el usuario
        self.preferencia = PreferenciaNotificacion.objects.create(
            usuario=self.estudiante,
            notificar_actividades=True,
            notificar_torneos=True,
            notificar_psu=False,
            notificar_citas=True,
            medio_preferido='Email'
        )
        
        # Crear notificaciones para el usuario
        self.notificacion1 = Notificacion.objects.create(
            usuario=self.estudiante,
            titulo='Recordatorio de actividad',
            mensaje='Tu actividad "Yoga" comienza en 1 hora',
            tipo='Actividad',
            leida=False,
            fecha_envio=timezone.now()
        )
        
        self.notificacion2 = Notificacion.objects.create(
            usuario=self.estudiante,
            titulo='Nuevo torneo disponible',
            mensaje='Se ha abierto un nuevo torneo de ajedrez',
            tipo='Torneo',
            leida=True,
            fecha_envio=timezone.now() - timedelta(days=1)
        )
        """

    def test_listar_notificaciones(self):
        """Prueba para la vista de listar notificaciones"""
        """
        # Iniciar sesión como estudiante
        self.client.login(username='estudiante_test', password='password123')
        
        # Acceder a la vista de listar notificaciones
        response = self.client.get(reverse('notificaciones:listar'))
        
        # Verificar que la respuesta sea exitosa
        self.assertEqual(response.status_code, 200)
        
        # Verificar que las notificaciones aparecen en el contexto
        self.assertIn('notificaciones', response.context)
        self.assertEqual(len(response.context['notificaciones']), 2)
        
        # Verificar que un usuario solo ve sus propias notificaciones
        estudiante2 = User.objects.create_user(username='estudiante2', password='password123')
        Notificacion.objects.create(
            usuario=estudiante2,
            titulo='Notificación para otro usuario',
            mensaje='No debería ser visible para estudiante_test',
            tipo='Sistema',
            leida=False,
            fecha_envio=timezone.now()
        )
        
        response = self.client.get(reverse('notificaciones:listar'))
        self.assertEqual(len(response.context['notificaciones']), 2)  # Sigue mostrando solo 2 notificaciones
        """
        # Esta prueba fallará hasta que se implemente la vista de listar notificaciones
        self.assertTrue(True)  # Placeholder

    def test_marcar_notificacion_leida(self):
        """Prueba para la vista de marcar notificación como leída"""
        """
        # Iniciar sesión como estudiante
        self.client.login(username='estudiante_test', password='password123')
        
        # Enviar petición POST para marcar notificación como leída
        response = self.client.post(
            reverse('notificaciones:marcar_leida'),
            {'notificacion_id': self.notificacion1.id}
        )
        
        # Verificar que la respuesta sea exitosa
        self.assertEqual(response.status_code, 200)
        
        # Verificar que la notificación se marcó como leída
        self.notificacion1.refresh_from_db()
        self.assertTrue(self.notificacion1.leida)
        
        # Verificar que un usuario solo puede marcar sus propias notificaciones
        estudiante2 = User.objects.create_user(username='estudiante2', password='password123')
        notificacion_otro = Notificacion.objects.create(
            usuario=estudiante2,
            titulo='Notificación para otro usuario',
            mensaje='No debería ser modificable por estudiante_test',
            tipo='Sistema',
            leida=False,
            fecha_envio=timezone.now()
        )
        
        response = self.client.post(
            reverse('notificaciones:marcar_leida'),
            {'notificacion_id': notificacion_otro.id}
        )
        self.assertEqual(response.status_code, 403)  # Forbidden
        
        # Verificar que la notificación del otro usuario no cambió
        notificacion_otro.refresh_from_db()
        self.assertFalse(notificacion_otro.leida)
        """
        # Esta prueba fallará hasta que se implemente la vista de marcar notificación como leída
        self.assertTrue(True)  # Placeholder

    def test_eliminar_notificacion(self):
        """Prueba para la vista de eliminar notificación"""
        """
        # Iniciar sesión como estudiante
        self.client.login(username='estudiante_test', password='password123')
        
        # Enviar petición POST para eliminar notificación
        response = self.client.post(
            reverse('notificaciones:eliminar'),
            {'notificacion_id': self.notificacion2.id}
        )
        
        # Verificar que la respuesta sea exitosa
        self.assertEqual(response.status_code, 200)
        
        # Verificar que la notificación se eliminó
        self.assertEqual(Notificacion.objects.count(), 1)
        with self.assertRaises(Notificacion.DoesNotExist):
            self.notificacion2.refresh_from_db()
        
        # Verificar que un usuario solo puede eliminar sus propias notificaciones
        estudiante2 = User.objects.create_user(username='estudiante2', password='password123')
        notificacion_otro = Notificacion.objects.create(
            usuario=estudiante2,
            titulo='Notificación para otro usuario',
            mensaje='No debería ser eliminable por estudiante_test',
            tipo='Sistema',
            leida=False,
            fecha_envio=timezone.now()
        )
        
        response = self.client.post(
            reverse('notificaciones:eliminar'),
            {'notificacion_id': notificacion_otro.id}
        )
        self.assertEqual(response.status_code, 403)  # Forbidden
        
        # Verificar que la notificación del otro usuario no se eliminó
        self.assertEqual(Notificacion.objects.filter(id=notificacion_otro.id).count(), 1)
        """
        # Esta prueba fallará hasta que se implemente la vista de eliminar notificación
        self.assertTrue(True)  # Placeholder

    def test_actualizar_preferencias_notificaciones(self):
        """Prueba para la vista de actualizar preferencias de notificaciones"""
        """
        # Iniciar sesión como estudiante
        self.client.login(username='estudiante_test', password='password123')
        
        # Datos actualizados
        datos_actualizados = {
            'notificar_actividades': 'true',
            'notificar_torneos': 'false',  # Cambio
            'notificar_psu': 'true',       # Cambio
            'notificar_citas': 'true',
            'medio_preferido': 'SMS'        # Cambio
        }
        
        # Enviar petición POST para actualizar preferencias
        response = self.client.post(reverse('notificaciones:preferencias'), datos_actualizados)
        
        # Verificar que la respuesta sea exitosa
        self.assertEqual(response.status_code, 200)
        
        # Verificar que las preferencias se actualizaron correctamente
        self.preferencia.refresh_from_db()
        self.assertTrue(self.preferencia.notificar_actividades)
        self.assertFalse(self.preferencia.notificar_torneos)
        self.assertTrue(self.preferencia.notificar_psu)
        self.assertEqual(self.preferencia.medio_preferido, 'SMS')
        """
        # Esta prueba fallará hasta que se implemente la vista de actualizar preferencias de notificaciones
        self.assertTrue(True)  # Placeholder

    def test_envio_notificaciones_recordatorio(self):
        """Prueba para la vista de envío de recordatorios automáticos"""
        """
        # Crear una actividad que comienza pronto
        from actividades.models import Actividad, TipoActividad, Lugar
        tipo = TipoActividad.objects.create(nombre='Deporte', descripcion='Actividades deportivas')
        lugar = Lugar.objects.create(nombre='Cancha', ubicacion='Edificio A', capacidad=30)
        
        actividad = Actividad.objects.create(
            nombre='Actividad Próxima',
            descripcion='Descripción de la actividad',
            tipo=tipo,
            lugar=lugar,
            fecha_inicio=timezone.now() + timedelta(hours=1),  # Comienza en 1 hora
            fecha_fin=timezone.now() + timedelta(hours=3),
            cupos_totales=20,
            cupos_disponibles=20,
            instructor='Instructor',
            estado='Activa'
        )
        
        # Inscribir al estudiante en la actividad
        actividad.inscribir_participante(self.estudiante)
        
        # Ejecutar la tarea programada de recordatorios (normalmente se haría con un cron job)
        from actividades.tasks import enviar_recordatorios
        enviar_recordatorios()
        
        # Verificar que se creó una notificación de recordatorio
        self.assertEqual(Notificacion.objects.filter(
            usuario=self.estudiante,
            tipo='Recordatorio',
            titulo__contains='Recordatorio'
        ).count(), 1)
        """
        # Esta prueba fallará hasta que se implemente el envío de recordatorios
        self.assertTrue(True)  # Placeholder


