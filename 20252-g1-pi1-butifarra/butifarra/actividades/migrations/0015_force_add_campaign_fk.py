from django.db import migrations

SQL_ADD_COLUMN = """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='actividades_notification' AND column_name='campaign_id'
    ) THEN
        ALTER TABLE actividades_notification ADD COLUMN campaign_id bigint NULL;
    END IF;
END $$;
"""

SQL_ADD_FK = """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name='actividades_notification'
          AND tc.constraint_type='FOREIGN KEY'
          AND kcu.column_name='campaign_id'
    ) THEN
        ALTER TABLE actividades_notification
        ADD CONSTRAINT actividades_notification_campaign_id_fkey
        FOREIGN KEY (campaign_id) REFERENCES actividades_campaign (id)
        DEFERRABLE INITIALLY DEFERRED;
    END IF;
END $$;
"""

SQL_ADD_INDEX = """
CREATE INDEX IF NOT EXISTS actividades_notification_campaign_idx
    ON actividades_notification (campaign_id);
"""

class Migration(migrations.Migration):
    dependencies = [
        ('actividades', '0014_fix_notification_campaign_column'),
    ]
    operations = [
        migrations.RunSQL(SQL_ADD_COLUMN, reverse_sql="ALTER TABLE actividades_notification DROP COLUMN campaign_id;"),
        migrations.RunSQL(SQL_ADD_FK, reverse_sql="ALTER TABLE actividades_notification DROP CONSTRAINT IF EXISTS actividades_notification_campaign_id_fkey;"),
        migrations.RunSQL(SQL_ADD_INDEX, reverse_sql="DROP INDEX IF EXISTS actividades_notification_campaign_idx;"),
    ]

