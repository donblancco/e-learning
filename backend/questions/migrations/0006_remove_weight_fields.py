# Generated migration to remove point_weight and time_weight fields

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('questions', '0005_update_difficulty_levels'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='question',
            name='point_weight',
        ),
        migrations.RemoveField(
            model_name='question',
            name='time_weight',
        ),
    ]