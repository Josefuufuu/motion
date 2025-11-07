# 🤝 Guía de Contribución – Proyecto BU-Tifarra

Este documento explica cómo trabajar en el repositorio usando **Git Flow** para que todo el equipo pueda colaborar sin conflictos.

---

## 🚀 Flujo de ramas con Git Flow

- **main** → rama estable, siempre lista para producción o entrega.  
- **develop** → rama de integración de todas las funcionalidades.  
- **feature/** → ramas para cada HU o tarea nueva.  
- **hotfix/** → correcciones rápidas en producción.  
- **release/** → preparación de versiones (opcional).  

---

## 🛠️ Checklist diario

Antes de empezar a trabajar ⏰ :

```bash
git checkout develop        # cambiar a develop
git pull origin develop     # traer los últimos cambios
git checkout feature/mi-tarea   # volver a tu rama de trabajo
git merge develop           # actualizar tu rama con lo más nuevo
```

## 📝 Crear una nueva feature

```bash 
git checkout develop               # partir desde develop
git pull origin develop            # asegurarse de estar actualizado
git checkout -b feature/nombre-HU  # crear nueva rama para la HU
git push origin feature/nombre-HU  # subir la rama a GitHub
```

Ejemplo:

```bash
git checkout -b feature/admin-home
```

## 💾 Guardar tu progreso

```bash 
git add .  
git commit -m "feat: implementar HomePage de administrador con ruta /admin/home"  
git push origin feature/admin-home
```

## Formato de commits (Conventional Commits)

- **feat:** → nueva funcionalidad.
- **fix:** → corrección de errores.
- **style:** → cambios de estilo (CSS).
- **docs:** → documentación.
- **refactor:** → reorganización del código.
- **test:** → pruebas.


## 🔄 Integración de cambios (PR)

1. Haz Push de tu rama feature/*.
2. Crea un Pull Request (PR) hacia develop.
3. Otro compañero revisa y aprueba.
4. Se hace merge a develop.
> 🔒 Sugerencia: proteger main y develop en GitHub para evitar push directo.

## 🚀 Entregas

- Al final del sprint, se hace merge de develop → main.
- main siempre debe quedar estable y listo para producción.


## 🧯 Hotfix (correcciones urgentes)

```bash 
git checkout main
git pull origin main
git checkout -b hotfix/fix-error-critico
# (realizar corrección)
git add .
git commit -m "fix: corregir error en login de beneficiarios"
git push origin hotfix/fix-error-critico
```

**Después**:
- Merge en **main** (para arreglar producción).
- Merge en **develop** (para que no se pierda el arreglo).