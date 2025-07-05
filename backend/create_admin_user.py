#!/usr/bin/env python
"""
Script to create admin user
"""
import os
import django
from django.contrib.auth import get_user_model

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'elearning.settings.production')
django.setup()

User = get_user_model()

# Check if user already exists
email = 'admin@example.com'
username = 'admin'
password = 'secure_password'

if User.objects.filter(email=email).exists():
    print(f"User with email {email} already exists.")
    user = User.objects.get(email=email)
    print(f"Existing user: {user.username} ({user.email}) - Role: {user.role}")
else:
    # Create admin user
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        role='admin',
        display_name='System Administrator',
        is_staff=True,
        is_superuser=True
    )
    print(f"Created admin user: {user.username} ({user.email}) - Role: {user.role}")

print("Admin user setup completed.")