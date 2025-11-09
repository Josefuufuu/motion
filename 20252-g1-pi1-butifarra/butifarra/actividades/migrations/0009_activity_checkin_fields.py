# Generated manually because automatic makemigrations is unavailable in this environment.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('actividades', '0008_activity_actual_attendees_activity_notes_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='activity',
            name='checkin_token',
            field=models.CharField(blank=True, max_length=64, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='activity',
            name='checkin_expires_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
