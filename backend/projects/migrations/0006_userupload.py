import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("projects", "0005_project_assignees"),
    ]

    operations = [
        migrations.CreateModel(
            name="UserUpload",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("file", models.FileField(upload_to="user_uploads/%Y/%m/%d/")),
                ("name", models.CharField(max_length=255)),
                ("file_size", models.BigIntegerField()),
                ("file_type", models.CharField(blank=True, max_length=100)),
                ("preview", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "owner",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="uploads", to=settings.AUTH_USER_MODEL
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="userupload",
            index=models.Index(fields=["owner", "-created_at"], name="projects_us_owner_i_da1d69_idx"),
        ),
    ]
