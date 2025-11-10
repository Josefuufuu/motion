# División de Vistas por Rol y Sistema de Notificaciones

Este documento resume la arquitectura implementada para restringir el acceso por rol en el frontend y backend, y el diseño del módulo de notificaciones (preferencias, disparadores y campañas/broadcast).

---
## 1. Roles Soportados
Roles manejados por el modelo `UserProfile.role`:
- `BENEFICIARY` (Estudiante / Beneficiario)
- `ADMIN`
- `PROFESSOR`

Helpers expuestos (propiedades/métodos):
- `profile.is_admin`
- `profile.is_beneficiary`
- `profile.is_professor`

En el frontend se consultan mediante el contexto de autenticación (`useAuth`).

---
## 2. Frontend: Protección de Rutas
Archivo principal: `src/App.jsx`.

Se definieron tres componentes de orden superior para envolver rutas:
- `PrivateRoute`: exige sesión iniciada.
- `AdminRoute`: exige sesión + rol administrador (o `is_staff`/`is_superuser`).
- `BeneficiaryRoute`: redirige a la home de admin si el usuario no es beneficiario.

Ejemplo de uso:
```jsx
<Route path="/notificaciones" element={(
  <AdminRoute>
    <NotificationsPage />
  </AdminRoute>
)} />
```

La redirección inicial (`/`) usa `LandingRedirect` para enviar al usuario a `/admin/home` o `/inicio` según rol.

### 2.1 Sidebar Dinámico
Archivo: `src/components/Sidebar/RouteSelect.jsx`.

El arreglo de rutas se construye según el rol:
- `adminRoutes`: incluye gestión, torneos administración, estadísticas, notificaciones.
- `beneficiaryRoutes`: actividades de estudiante (inicio, calendario, torneos, voluntariados, citas psicológicas).
- `professorRoutes`: vista de profesor y calendario.

Se añadió la ruta alias `/admin/estadisticas` que apunta al mismo componente que `/estadisticas` para evitar 404 cuando el sidebar usa el prefijo de administración.

---
## 3. Backend: Control de Acceso
En los ViewSets y endpoints relacionados a notificaciones y campañas se valida:
- Usuario autenticado.
- Para acciones administrativas (`broadcast`, listar campañas) se verifica `request.user.profile.is_admin` o flags de superusuario.

Esto garantiza que solo personal autorizado puede enviar campañas masivas.

---
## 4. Sistema de Notificaciones
### 4.1 Modelos Principales
Definidos (o reintroducidos) en `actividades/models.py`:
- `NotificationPreference`: canales habilitados por usuario y horas silenciosas.
- `Notification`: una instancia por canal (app/email/push/sms) con estado (`pending`, `scheduled`, `sent`, `failed`, `read`).
- `NotificationDeliveryLog`: registro por intento de entrega (especialmente email/push/sms).
- `Campaign`: representa un broadcast masivo, métricas agregadas y segmentación.

Índices agregados optimizan consultas por usuario, estado, programación futura y vínculo a actividad.

### 4.2 Preferencias Automáticas
Signal `post_save(User)` asegura que al crear un usuario se generen sus preferencias si no existen:
```python
@receiver(post_save, sender=User)
def create_notification_preferences(sender, instance, created, **kwargs):
    if created:
        NotificationPreference.objects.get_or_create(user=instance)
```

### 4.3 Disparadores por Cambio en Actividades
En `Activity.save()` se comparan campos críticos (`start`, `location`, `status`). Si cambian:
1. Se genera un mensaje descriptivo mediante `_activity_change_message`.
2. Se lista usuarios inscritos + profesor asignado.
3. Se crean notificaciones por cada canal elegible (`_eligible_channels`).
4. Canal `app` se marca como `sent` inmediato; otros quedan `pending`.

Esto es no intrusivo: si ocurre algún error durante el encolado, se captura para no interrumpir el guardado de la actividad.

### 4.4 Broadcast / Campañas
Endpoint admin `POST /api/notifications/broadcast/`:
1. Valida permisos.
2. Crea `Campaign` con segmentación (todos / estudiantes / profesores / seleccionados).
3. Determina canales según `channel_option` (AMBOS / CORREO / PUSH).
4. Respeta preferencias del usuario (no crea notificación para canal deshabilitado / sin email registrado).
5. Marca notificaciones in-app como `sent` y las de email como `pending` o `scheduled` si se programó.
6. Email inmediato opcional mediante bandera `SEND_EMAIL_IMMEDIATE` en settings.
7. Registra logs de entrega (`NotificationDeliveryLog`).
8. Actualiza métricas con `campaign.update_metrics()`.

### 4.5 Lectura y Marcado
Endpoints:
- `GET /api/notifications/`: lista notificaciones del usuario actual.
- `POST /api/notifications/{id}/read/`: marca una notificación como leída (`status=read`, `read_at`).
- `POST /api/notifications/mark-all-read/`: marca todas las notificacions del usuario.
- Preferencias: `GET/PATCH /api/notification-preferences/`.

### 4.6 Evitar Duplicados
Función `_should_create_similar` evita crear múltiples notificaciones idénticas dentro de una ventana de 10 minutos para el mismo usuario y actividad.

### 4.7 Programación Futura
Si `scheduled_for` está en el futuro (`status=scheduled`), una tarea externa (cron/Celery) debería procesarlas y cambiar a `sent` al momento apropiado.

---
## 5. Integración de Email
Se utiliza la cuenta de ejemplo `cifuentesclud@gmail.com` y su app key en settings para permitir envío SMTP directo durante desarrollo. Configuración típica en `settings.py`:
```python
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = "cifuentesclud@gmail.com"
EMAIL_HOST_PASSWORD = "APP_KEY_AQUI"
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER
SEND_EMAIL_IMMEDIATE = True  # activa envío inmediato en broadcast
```

Notas:
- Para producción se recomienda usar cola (Celery) y proveedores transaccionales.
- Evitar commitear claves reales (usar variables de entorno). La presente clave es de prueba.

---
## 6. Flujo Completo de una Notificación de Cambio de Actividad
1. Admin/profesor edita actividad y cambia `start`.
2. `Activity.save()` detecta diferencia y arma `changes`.
3. Se llama `enqueue_activity_change_notifications(activity, changes)`.
4. Para cada usuario inscrito y profesor:
   - Obtiene canales preferidos.
   - Crea `Notification` por canal (app/email...).
5. El frontend consulta `/api/notifications/` y presenta el listado.
6. Usuario marca como leída → `read_at` se actualiza y estado pasa a `read`.

---
## 7. Flujo de Broadcast
1. Admin completa formulario en `/notificaciones` con título, mensaje, segmento y canal.
2. Frontend envía JSON al endpoint `broadcast`.
3. Backend crea `Campaign` y genera notificaciones en lote (`bulk_create`).
4. Email inmediato: se envían correos y se generan `NotificationDeliveryLog`.
5. Métricas calculadas y devueltas en la respuesta (`created`, `app_sent`, `email_queue`, `campaign_id`).

---
## 8. Puntos de Extensión
- Añadir soporte real para push (FCM) y SMS (Twilio u otro).
- Internacionalización (traducción del contenido de notificaciones).
- Paginación y filtros avanzados en `NotificationViewSet` (no leídas, rango de fechas).
- Job periódico para enviar notificaciones programadas.

---
## 9. Consideraciones de Migraciones
- Se consolidó todo en una migración única cuando fue necesario (`0013_...`).
- Al portar a otro entorno, revisar que la tabla no exista previamente para evitar `DuplicateTable`.
- Si ya hay tablas (por reinstalación parcial), usar `--fake` o ajustar el número de migración.

---
## 10. Resumen
La división por rol garantiza que cada tipo de usuario vea sólo sus vistas autorizadas. El módulo de notificaciones provee:
- Preferencias por usuario.
- Disparadores automáticos ante cambios de actividades.
- Broadcast segmentado por rol o selección manual.
- Historial y métricas de campañas.
- Envío inmediato de emails opcional.

Esto crea una base sólida para futuras expansiones (push, SMS, programación avanzada) manteniendo desacoplada la lógica de creación y entrega.

