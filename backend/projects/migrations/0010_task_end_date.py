from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0009_alter_task_category"),
    ]

    operations = [
        migrations.AddField(
            model_name="task",
            name="end_date",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
