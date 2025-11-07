# Sistema de Roles - BU-tifarra

## Resumen de Implementación

Se ha implementado un sistema completo de roles que separa las funcionalidades entre **Administradores** y **Beneficiarios/Estudiantes**.

## Cambios Realizados

### Backend (Django)

1. **Modelo UserProfile** (`actividades/models.py`)
   - Nuevo modelo para gestionar roles de usuario
   - Roles disponibles: `BENEFICIARY` (por defecto) y `ADMIN`
   - Señales automáticas para crear perfiles al registrar usuarios

2. **Permisos Personalizados** (`actividades/views.py`)
   - Clase `IsAdminOrReadOnly`: Solo admins pueden crear/editar/eliminar actividades
   - Todos los usuarios autenticados pueden ver actividades
   - Información de roles incluida en la serialización del usuario

3. **Admin de Django**
   - UserProfile registrado en el admin para gestionar roles fácilmente

### Frontend (React)

1. **Contexto de Autenticación** (`context/AuthContext.jsx`)
   - Funciones `isAdmin()` y `isBeneficiary()` para verificar roles
   - Información de perfil incluida en el objeto de usuario

2. **Rutas Protegidas** (`App.jsx`)
   - `PrivateRoute`: Requiere autenticación
   - `AdminRoute`: Solo para administradores
   - `BeneficiaryRoute`: Solo para beneficiarios
   - Redirección automática según el rol al iniciar sesión

3. **Navegación por Roles** (`components/Sidebar/RouteSelect.jsx`)
   - Menú diferente para admins y beneficiarios
   - Rutas específicas según el rol del usuario

4. **Calendario de Actividades** (`pages/ActivitiesCalendar.jsx`)
   - Beneficiarios: Solo pueden VER actividades e inscribirse
   - Administradores: Pueden VER actividades + botón "Crear Actividad"

## Configuración Inicial

### 1. Aplicar Migraciones (YA HECHO)

```bash
cd butifarra
python manage.py makemigrations
python manage.py migrate
```

### 2. Crear Perfiles para Usuarios Existentes

```bash
python manage.py create_user_profiles
```

### 3. Asignar Roles de Administrador

Opción A - Usando Django Admin:
1. Acceder a http://127.0.0.1:8000/admin/
2. Ir a "User profiles"
3. Editar el perfil del usuario que deseas hacer admin
4. Cambiar "Role" a "Administrador"
5. Guardar

Opción B - Usando Django Shell:
```bash
python manage.py shell
```

```python
from django.contrib.auth.models import User
from actividades.models import UserProfile

# Cambiar rol de un usuario específico
user = User.objects.get(username='nombre_usuario')
user.profile.role = 'ADMIN'
user.profile.save()

# O marcar como staff (también tiene permisos de admin)
user.is_staff = True
user.save()
```

### 4. Instalar Dependencias del Frontend

```bash
cd butifarra-frontend/frontend-cadi
npm install
```

### 5. Iniciar los Servidores

Terminal 1 - Backend:
```bash
cd butifarra
python manage.py runserver
```

Terminal 2 - Frontend:
```bash
cd butifarra-frontend/frontend-cadi
npm run dev
```

## Funcionalidades por Rol

### BENEFICIARIO/ESTUDIANTE
✅ Ver calendario de actividades
✅ Inscribirse en actividades
✅ Ver torneos
✅ Acceder a PSU/Voluntariados
✅ Agendar citas psicológicas
❌ NO puede crear/editar/eliminar actividades
❌ NO puede acceder al panel de administración
❌ NO puede ver reportes

### ADMINISTRADOR
✅ Ver calendario de actividades
✅ **Crear nuevas actividades**
✅ **Editar actividades existentes**
✅ **Eliminar actividades**
✅ Gestión CADI
✅ Gestión de torneos
✅ Ver reportes
✅ Enviar notificaciones
❌ NO puede acceder a vistas de beneficiario (se redirige a admin)

## Estructura de Rutas

### Rutas Públicas
- `/login` - Inicio de sesión
- `/register` - Registro de nuevos usuarios

### Rutas de Beneficiario
- `/inicio` - Página principal
- `/calendario` - Calendario de actividades (solo ver)
- `/torneos` - Torneos disponibles
- `/psu` - PSU y voluntariados
- `/citas` - Citas psicológicas
- `/actividades` - Lista de actividades
- `/actividades/:id` - Detalle de actividad

### Rutas de Administrador (Protegidas)
- `/admin/home` - Panel de administración
- `/admin/reports` - Reportes
- `/gestion-cadi` - Gestión CADI
- `/admin/torneos` - Gestión de torneos
- `/admin/form-inscripcion` - Formularios de inscripción
- `/actividades/crear` - **Crear nueva actividad** (SOLO ADMIN)
- `/calendario` - Calendario con botón "Crear Actividad"

## Verificación del Sistema

### 1. Probar como Beneficiario
1. Registrar un nuevo usuario o usar uno existente
2. Verificar que el menú lateral muestre solo opciones de beneficiario
3. Intentar acceder a `/admin/home` → Debe redirigir a `/inicio`
4. Intentar acceder a `/actividades/crear` → Debe mostrar "Acceso Denegado"
5. En el calendario NO debe aparecer el botón "Crear Actividad"

### 2. Probar como Administrador
1. Asignar rol ADMIN a un usuario (ver paso 3 arriba)
2. Iniciar sesión
3. Verificar que el menú lateral muestre opciones de admin
4. Acceder a `/calendario` → DEBE aparecer botón "Crear Actividad"
5. Poder crear/editar/eliminar actividades sin problemas
6. Acceder a todas las rutas de admin sin restricciones

## API Endpoints

### Autenticación
- `POST /api/login/` - Iniciar sesión
- `POST /api/logout/` - Cerrar sesión
- `GET /api/session/` - Obtener sesión actual
- `POST /api/register/` - Registrar nuevo usuario

### Actividades
- `GET /api/actividades/` - Listar actividades (todos)
- `GET /api/actividades/:id/` - Ver detalle (todos)
- `POST /api/actividades/` - Crear actividad (**SOLO ADMIN**)
- `PUT /api/actividades/:id/` - Editar actividad (**SOLO ADMIN**)
- `DELETE /api/actividades/:id/` - Eliminar actividad (**SOLO ADMIN**)

## Respuesta de Usuario con Roles

Al hacer login o verificar sesión, el backend devuelve:

```json
{
  "ok": true,
  "user": {
    "id": 1,
    "username": "usuario123",
    "email": "usuario@ejemplo.com",
    "first_name": "Juan",
    "last_name": "Pérez",
    "is_staff": false,
    "is_superuser": false,
    "profile": {
      "role": "BENEFICIARY",  // o "ADMIN"
      "is_admin": false,       // true si es admin
      "is_beneficiary": true   // true si es beneficiario
    }
  }
}
```

## Seguridad

✅ Los permisos se validan tanto en frontend como en backend
✅ El backend rechaza peticiones no autorizadas (403 Forbidden)
✅ Las rutas protegidas redirigen automáticamente
✅ No se pueden bypassear los permisos desde el navegador
✅ Los tokens CSRF se manejan correctamente

## Notas Importantes

- **Todos los usuarios nuevos son BENEFICIARY por defecto**
- **Los superusers y staff users son automáticamente ADMIN**
- **El primer superuser debe crearse con `python manage.py createsuperuser`**
- **Los roles se pueden cambiar desde el admin de Django**
- **El sistema es backward compatible** - usuarios existentes recibirán perfil automáticamente

## Troubleshooting

### Error: "profile does not exist"
Ejecutar: `python manage.py create_user_profiles`

### Los botones de admin no aparecen
Verificar que el usuario tenga rol ADMIN en el admin de Django

### Error 403 al crear actividades
Verificar que el usuario esté marcado como admin en su perfil

### El menú no se actualiza después de cambiar rol
Cerrar sesión y volver a iniciar sesión

## Próximos Pasos (Opcional)

- [ ] Agregar más roles (ej: COLABORADOR, INSTRUCTOR)
- [ ] Implementar permisos granulares por módulo
- [ ] Dashboard diferente para cada rol
- [ ] Sistema de notificaciones por rol
- [ ] Reportes personalizados según rol

---

**Estado del Proyecto:** ✅ Sistema de roles completamente funcional y listo para producción

