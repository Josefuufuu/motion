# Guía de Implementación del Módulo de Notificaciones

Esta guía explica **exactamente** cómo replicar en otro entorno la implementación de notificaciones usada en este proyecto. Está pensada para que otra instancia de una IA/ingeniero pueda portar el módulo sin ambigüedad.

## Checklist General
1. Crear modelos: `NotificationPreference`, `Notification`, `NotificationDeliveryLog`, `Campaign`.
2. Añadir funciones helper para cambios de actividades y encolado de notificaciones.
3. Extender el modelo `Activity` para disparar notificaciones cuando cambian campos críticos.
4. Crear serializers para los modelos anteriores.
5. Implementar los ViewSets y endpoints: `NotificationViewSet`, `CampaignViewSet`, acción `broadcast`, endpoint de preferencias `api_notification_preferences`.
6. Registrar rutas en `urls.py` vía `DefaultRouter` y endpoints adicionales.
7. Ajustar migraciones (orden y dependencias); evitar referencias a merges inexistentes.
8. Configurar logging opcional y bandera de entorno `SEND_EMAIL_IMMEDIATE` + `DEFAULT_FROM_EMAIL`.
9. Integrar front-end: endpoints para listar, marcar leídas, campañas y preferencias.
10. (Opcional) Agregar job/scheduler para envío diferido de email/push si hay notificaciones `scheduled`.

---
## 1. Modelos
Archivo origen: `actividades/models.py`.

### 1.1 NotificationPreference
```python
class NotificationPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="notification_preferences")
    email_enabled = models.BooleanField(default=True)
    app_enabled = models.BooleanField(default=True)
    push_enabled = models.BooleanField(default=False)
    sms_enabled = models.BooleanField(default=False)
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
```
Crear también un signal `post_save` para asegurar preferencias en el alta de usuario.

### 1.2 Notification
Representa una notificación individual por canal.
Campos principales:
- `user` (FK User) / `activity` (FK Activity opcional)
- `title`, `body`
- `channel` (choices: app, email, push, sms)
- `status` (pending, scheduled, sent, failed, read)
- `priority` (low, normal, high)
- `scheduled_for`, `sent_at`, `read_at`
- `metadata` (JSON: tipo, campos cambiados, campaign_id, etc.)

Incluye métodos: `mark_sent()`, `mark_read()`.

### 1.3 NotificationDeliveryLog
Log por intento de envío (solo email/push/sms). Campos: `notification`, `channel`, `status`, `detail`, `created_at`.

### 1.4 Campaign
Agrupa broadcasts masivos:
- `name`, `message`, `channel_option` (CORREO | PUSH | AMBOS)
- `segment` (Todos los usuarios | Solo Estudiantes | Solo Profesores | Seleccionados)
- `selected_user_ids` (lista opcional)
- `schedule_at` (DateTime si se programa)
- Métricas: `total_recipients`, `app_sent`, `emails_sent`
- Método `update_metrics()` recalcula agregados consultando `Notification`.

### 1.5 Helper Functions
Colocar al final de `models.py` (evitar import circular):
- `_activity_change_message(activity, changes)` → (title, body)
- `_should_create_similar(user, activity, title)` evita duplicados recientes.
- `_eligible_channels(user)` determina canales según preferencias.
- `enqueue_activity_change_notifications(activity, changes)` crea `Notification` para usuarios inscritos + profesor asignado.

### 1.6 Modificación en `Activity.save()`
Antes/después del `super().save()` comparar campos críticos (`start`, `location`, `status`). Si cambian, llamar `enqueue_activity_change_notifications()`.

Campos nuevos requeridos ya están presentes: `assigned_professor`, `actual_attendees`, `notes`.

---
## 2. Serializers
Archivo: `actividades/serializers.py`.

Crear:
- `NotificationPreferenceSerializer`
- `NotificationDeliveryLogSerializer`
- `NotificationSerializer` (incluye logs vía `delivery_logs` related_name)
- `CampaignSerializer`

Evitar exponer campos de escritura que no proceden (ej. `user` en Notification es read-only).

---
## 3. ViewSets y Endpoints
Archivo: `actividades/views.py`.

### 3.1 Router
En `actividades/urls.py`:
```python
router.register(r'api/notifications', NotificationViewSet, basename='notifications')
router.register(r'api/campaigns', CampaignViewSet, basename='campaigns')
```

### 3.2 NotificationViewSet
Tipo `ReadOnlyModelViewSet` sobre `Notification` filtrando por `user` actual.
Acciones:
- `mark_all_read` (POST) → actualiza status y `read_at`.
- `read` (POST detalle) → `mark_read()` sobre notificación específica.
- `list_campaigns` (GET, restringido a admin) → últimas campañas.
- `get_campaign` (GET con PK) → detalle campaña admin.
- `broadcast` (POST admin) → creación masiva: 
  - Body: `{ name/title, message/body, channel, segment, selected_user_ids, scheduleDate, scheduleTime }`
  - Segmentos filtran usuarios vía `User.profile.role`.
  - Genera `Campaign` y `Notification` (bulk_create). 
  - Si bandera `SEND_EMAIL_IMMEDIATE` activa, intento inmediato de envío email y log.

### 3.3 CampaignViewSet
Solo lectura para admins: lista y detalle.

### 3.4 Preferencias
Endpoint función: `api_notification_preferences`:
- GET devuelve `NotificationPreferenceSerializer` del usuario.
- PATCH/PUT actualiza campos (parcial).

### 3.5 Seguridad
Reutilizar helper `profile.is_admin` para autorizar acciones. Admin = usuario con rol ADMIN o `is_staff`/`is_superuser`.

---
## 4. Rutas HTTP Resultantes
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/notifications/` | Lista notificaciones del usuario |
| POST | `/api/notifications/mark-all-read/` | Marca todas como leídas |
| POST | `/api/notifications/{id}/read/` | Marca una como leída |
| GET | `/api/notifications/campaigns/` | Lista campañas (admin) |
| GET | `/api/notifications/campaigns/{id}/` | Detalle campaña (admin) |
| POST | `/api/notifications/broadcast/` | Crea campaña + notificaciones (admin) |
| GET | `/api/notification-preferences/` | Obtener preferencias usuario |
| PATCH | `/api/notification-preferences/` | Actualizar preferencias |

*(Además de los viewsets existentes de actividades y torneos)*

---
## 5. Lógica de Broadcast
1. Validar permisos admin.
2. Parsear parámetros horario (date + time) → `scheduled_for` (aware timezone).
3. Determinar canales:
   - AMBOS → `email` + `app`
   - CORREO → `email`
   - PUSH → `app` (si se desea `push` separado, ampliar)
4. Filtrar destinatarios según segmento.
5. Respetar preferencias: si `email_enabled` falso, saltar email; si `app_enabled` falso, saltar app.
6. Status inicial por canal:
   - app: `sent` inmediato (se marca `sent_at` now)
   - email sin programación: `pending` (si se envía inmediatamente) o `scheduled` si `scheduled_for` futuro.
7. Bulk create de `Notification` para eficiencia.
8. Envío inmediato de email si `SEND_EMAIL_IMMEDIATE=True` y no `scheduled_for` futuro.
9. Registrar `NotificationDeliveryLog` con resultado.
10. Actualizar métricas `Campaign.update_metrics()`.

---
## 6. Migraciones
Orden recomendado (cada archivo en `actividades/migrations/`):
1. Crear modelos base (Activity, etc. ya existentes).
2. Añadir modelos Notification + DeliveryLog (`0009_notification_...`).
3. Añadir Campaign (`0010_campaign`).
4. Añadir TournamentEnrollment si aplica (`0011_tournamentenrollment`).
5. Evitar dependencias a merges inexistentes (quitar referencias tipo `0010_merge_xxx`).
6. Si existiera migración de reparación (ej. `repair_activity_assigned_professor`), convertir a no-op para mayor portabilidad (especialmente con SQLite vs Postgres).

### Consideraciones DB
- Índices definidos en cada modelo para consultas rápidas (`user,status`, `scheduled_for`, `activity,channel`).
- Para programar envíos futuros de email/push, agregar proceso externo (Celery/cron) que seleccione `status='scheduled'` y `scheduled_for<=now`.

---
## 7. Logging y Configuración
En `settings.py` se puede definir un logger dedicado:
```python
LOGGING = {
  'loggers': {
    'actividades.email': {
      'handlers': ['console'],
      'level': 'INFO',
    },
  }
}
```
Variables de entorno recomendadas:
- `SEND_EMAIL_IMMEDIATE=true` (para envío sin cola)
- `DEFAULT_FROM_EMAIL="no-reply@midominio.com"`

Para producción se aconseja sustituir envío inmediato por una cola (Celery + SMTP real) y marcar inicialmente `status='queued'`.

---
## 8. Front-End Integración (Resumen)
### 8.1 Notificaciones (campanita / listado)
- Polling o fetch inicial: `GET /api/notifications/?page=1` (paginación opcional; no implementada en este ejemplo).
- Marcar una como leída: `POST /api/notifications/{id}/read/`.
- Marcar todas: `POST /api/notifications/mark-all-read/`.

### 8.2 Broadcast (Admin)
Formular campos: título, mensaje, canal, segmento, IDs seleccionados, fecha/hora (opcional). Enviar JSON a `POST /api/notifications/broadcast/`.
Respuesta incluye: `created`, `app_sent`, `email_queue`, `campaign_id`.

### 8.3 Preferencias Usuario
- GET `/api/notification-preferences/` → estado actual.
- PATCH `/api/notification-preferences/` con JSON parcial `{ "email_enabled": false }`.

### 8.4 Representación de Notificación (ejemplo)
```json
{
  "id": 123,
  "title": "Actualización de actividad: Yoga",
  "body": "La actividad 'Yoga' ha sido actualizada...",
  "channel": "app",
  "status": "sent",
  "priority": "normal",
  "scheduled_for": null,
  "sent_at": "2025-11-10T09:23:01Z",
  "read_at": null,
  "metadata": { "type": "activity_change", "fields": ["start"] },
  "created_at": "2025-11-10T09:23:01Z",
  "logs": []
}
```

---
## 9. Permisos y Roles
`profile.role` esperado: `BENEFICIARY`, `ADMIN`, `PROFESSOR`.
- Admin (o `is_staff` / `is_superuser`) puede: broadcast, listar campañas.
- Usuario normal: sólo listar sus notificaciones y preferencias.
- Profesor recibe notificaciones de cambios en actividades donde es asignado.

---
## 10. Escenarios y Edge Cases
| Caso | Manejo |
|------|--------|
| Cambio repetido rápido | `_should_create_similar` evita duplicados (<10 min) |
| Usuario sin email | Se crea notificación app; email marcado failed (log) |
| Preferencias desactivadas | Canal omitido en broadcast/enqueue |
| Programación futura | `status='scheduled'` y `scheduled_for` se respetan; requiere tarea externa para envío email real |
| Segmento sin usuarios | Campaña creada con `created=0` y métricas 0 |
| Campos críticos vacíos | Validar en Activity antes de guardar (ya implementado) |

---
## 11. Portabilidad / Adaptaciones
Para otro entorno:
1. Copiar modelos y serializers.
2. Ajustar import de User si se usa `get_user_model()` en lugar de `django.contrib.auth.models.User`.
3. Sustituir envío inmediato de email por cola (opcional).
4. Añadir tests (unitarios) para:
   - Creación de notificaciones por cambio de actividad.
   - Broadcast segmentado (profesores vs estudiantes).
   - Preferencias desactivando email/app.
   - Marcar leídas.
5. Verificar migraciones: renumerar si hay conflictos (mantener orden lógico). 

---
## 12. Ejemplo de Test para Broadcast (pseudo)
```python
@pytest.mark.django_db
def test_broadcast_admin(client, admin_user):
    client.force_login(admin_user)
    payload = {
        'name': 'Aviso general',
        'message': 'Mantenimiento del sistema',
        'channel': 'AMBOS',
        'segment': 'Todos los usuarios'
    }
    resp = client.post('/api/notifications/broadcast/', payload, content_type='application/json')
    assert resp.status_code == 201
    data = resp.json()
    assert data['created'] >= 1
    assert 'campaign_id' in data
```

---
## 13. Resumen Rápido (TL;DR)
- Cada notificación es por canal → permite tracking de envío y lectura.
- Activity dispara notificaciones al cambiar `start`, `location`, `status`.
- Broadcast genera Campaign + múltiples Notification respetando preferencias.
- Preferencias controlan canales activos por usuario.
- Logs guardan intentos de envío email (o push/sms si se extiende).

---
## 14. Extensiones Futuras
- Soporte real para push (FCM) y sms (proveedor externo).
- Cola de envíos programados (Celery + periodic task).
- Paginación y filtros avanzados (fecha mínima, sólo no leídas) en `NotificationViewSet`.
- Internacionalización de mensajes (i18n).

---
## 15. Validación Final
Antes de deploy en nuevo entorno:
1. `python manage.py makemigrations` y `migrate` sin errores.
2. Crear usuario, modificar una actividad → aparecen notificaciones.
3. Ejecutar broadcast como admin → métricas campaña correctas.
4. Cambiar preferencias (desactivar email) → siguiente broadcast omite email.

---
**Esta documentación refleja el estado actual del módulo en este proyecto y sirve como especificación de referencia para su implementación en otro entorno.**

