from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("actividades", "0010_merge_20251109_2224"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="TournamentEnrollment",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pendiente"),
                            ("confirmed", "Confirmada"),
                            ("cancelled", "Cancelada"),
                        ],
                        default="confirmed",
                        max_length=16,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "tournament",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="enrollments",
                        to="actividades.tournament",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="tournament_enrollments",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.AddIndex(
            model_name="tournamentenrollment",
            index=models.Index(
                fields=["tournament", "status"], name="actividades_tournam_11c2e0_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="tournamentenrollment",
            index=models.Index(fields=["user"], name="actividades_user_id_892086_idx"),
        ),
        migrations.AlterUniqueTogether(
            name="tournamentenrollment",
            unique_together={("user", "tournament")},
        ),
    ]
