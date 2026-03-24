# Generated manually for encrypted session fields

from django.db import migrations

import accounts.encrypted_fields


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_usersession"),
    ]

    operations = [
        migrations.AlterField(
            model_name="usersession",
            name="ip_address",
            field=accounts.encrypted_fields.EncryptedTextField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="usersession",
            name="location",
            field=accounts.encrypted_fields.EncryptedTextField(blank=True),
        ),
        migrations.AlterField(
            model_name="usersession",
            name="user_agent",
            field=accounts.encrypted_fields.EncryptedTextField(blank=True),
        ),
    ]
