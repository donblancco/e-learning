# Generated by Django 4.2.7

from django.db import migrations

def update_difficulty_levels(apps, schema_editor):
    """
    Map existing difficulty levels 1-5 to new 1-3 system:
    1,2 -> 1 (初級)
    3,4 -> 2 (中級)  
    5 -> 3 (上級)
    """
    Question = apps.get_model('questions', 'Question')
    
    # Update difficulty levels
    Question.objects.filter(difficulty__in=[1, 2]).update(difficulty=1)  # 初級
    Question.objects.filter(difficulty__in=[3, 4]).update(difficulty=2)  # 中級
    Question.objects.filter(difficulty=5).update(difficulty=3)  # 上級

def reverse_difficulty_levels(apps, schema_editor):
    """
    Reverse the mapping - this is a best effort reverse as we lose some granularity
    """
    Question = apps.get_model('questions', 'Question')
    
    # Reverse mapping (approximate)
    Question.objects.filter(difficulty=1).update(difficulty=2)  # 初級 -> 2
    Question.objects.filter(difficulty=2).update(difficulty=3)  # 中級 -> 3
    Question.objects.filter(difficulty=3).update(difficulty=5)  # 上級 -> 5

class Migration(migrations.Migration):

    dependencies = [
        ('questions', '0004_add_reviewed_at_field'),
    ]

    operations = [
        migrations.RunPython(update_difficulty_levels, reverse_difficulty_levels),
    ]