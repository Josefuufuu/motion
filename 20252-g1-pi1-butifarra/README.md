# josephpi

## Configuración de cookies de sesión y CSRF

El backend de Django permite ajustar las banderas de las cookies para que el frontend pueda
recuperar la sesión tanto en entornos HTTP locales como en despliegues bajo HTTPS.

| Variable | Valor por defecto | Cuándo cambiarla |
| --- | --- | --- |
| `SESSION_COOKIE_SAMESITE` | `Lax` | Usa `None` solo cuando el frontend consuma la API desde otro dominio servido bajo HTTPS. |
| `CSRF_COOKIE_SAMESITE` | `Lax` | Igual que la variable anterior. |
| `SESSION_COOKIE_SECURE` | `True` si `SESSION_COOKIE_SAMESITE=None`, en caso contrario `False` | Activa `True` solo en despliegues HTTPS que necesiten `SameSite=None`. |
| `CSRF_COOKIE_SECURE` | `True` si `CSRF_COOKIE_SAMESITE=None`, en caso contrario `False` | Igual que la variable anterior. |

### Desarrollo local (HTTP)

No necesitas tocar ninguna variable de entorno: las cookies se enviarán con `SameSite=Lax` y
las banderas `Secure` desactivadas, por lo que funcionarán con `python manage.py runserver`.

### Despliegue con HTTPS

1. Establece `SESSION_COOKIE_SAMESITE=None` y `CSRF_COOKIE_SAMESITE=None` en tu entorno.
2. Opcionalmente puedes fijar explícitamente `SESSION_COOKIE_SECURE=True` y
   `CSRF_COOKIE_SECURE=True` (se activan automáticamente cuando `SameSite=None`).
3. Ejecuta Django tras un terminador TLS o usa certificados locales, por ejemplo:

   ```bash
   python manage.py runserver 0.0.0.0:8000 --cert-file /ruta/a/cert.pem --key-file /ruta/a/key.pem
   ```

   Cualquier configuración que exponga la aplicación bajo HTTPS (Nginx, Caddy, etc.) es válida.

Con esta configuración el frontend podrá seguir recuperando la sesión sin que el navegador
bloquee las cookies en función del entorno.
