from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='owner',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, related_name='owned_projects', to='api.user'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='project',
            name='collaborators',
            field=models.ManyToManyField(blank=True, related_name='collab_projects', to='api.user'),
        ),
        migrations.AddField(
            model_name='task',
            name='owner',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, related_name='owned_tasks', to='api.user'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='task',
            name='contributors',
            field=models.ManyToManyField(blank=True, related_name='collab_tasks', to='api.user'),
        ),
    ]








