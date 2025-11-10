from django.db import migrations


def add_campaign_fk_if_missing(apps, schema_editor):
    connection = schema_editor.connection
    cursor = connection.cursor()
    table_name = 'actividades_notification'
    try:
        # Obtener descripción de tabla
        description = connection.introspection.get_table_description(cursor, table_name)
    except Exception:
        return  # Si la tabla no existe, nada que hacer
    existing_cols = {col.name for col in description}

    # Añadir columna campaign_id si falta
    if 'campaign_id' not in existing_cols:
        schema_editor.execute("ALTER TABLE actividades_notification ADD COLUMN campaign_id bigint NULL;")

    # Verificar si ya existe la constraint FK (buscamos por columna y referencia)
    fk_exists = False
    try:
        cursor.execute("""
            SELECT 1
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'actividades_notification'
              AND tc.constraint_type = 'FOREIGN KEY'
              AND kcu.column_name = 'campaign_id';
        """)
        fk_exists = cursor.fetchone() is not None
    except Exception:
        fk_exists = False

    if not fk_exists:
        # Intentar crear FK constraint con nombre estable
        try:
            schema_editor.execute(
                "ALTER TABLE actividades_notification ADD CONSTRAINT actividades_notification_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES actividades_campaign (id) DEFERRABLE INITIALLY DEFERRED;"
            )
        except Exception:
            # Ignorar si falla (por ejemplo tabla campaign no existe aún)
            pass

    # Crear índice si falta (Postgres permite IF NOT EXISTS)
    schema_editor.execute(
        "CREATE INDEX IF NOT EXISTS actividades_notification_campaign_idx ON actividades_notification (campaign_id);"
    )


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('actividades', '0013_campaign_notification_notificationdeliverylog_and_more'),
    ]

    operations = [
        migrations.RunPython(add_campaign_fk_if_missing, reverse_code=noop),
    ]

