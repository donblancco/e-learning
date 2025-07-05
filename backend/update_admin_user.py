#!/usr/bin/env python
"""
Script to update existing user to admin
"""
import os
import django
from django.contrib.auth import get_user_model

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'elearning.settings.production')
django.setup()

User = get_user_model()

# Update existing user to admin
email = 'admin@example.com'
password = 'secure_password'

try:
    user = User.objects.get(email=email)
    print(f"Found user: {user.username} ({user.email}) - Current role: {user.role}")
    
    # Update user to admin
    user.role = 'admin'
    user.is_staff = True
    user.is_superuser = True
    user.display_name = 'System Administrator'
    user.set_password(password)  # Update password
    user.save()
    
    print(f"Updated user: {user.username} ({user.email}) - New role: {user.role}")
    print(f"Staff status: {user.is_staff}, Superuser status: {user.is_superuser}")
    print("Admin user update completed successfully.")
    
except User.DoesNotExist:
    print(f"User with email {email} does not exist.")
    # Create new admin user
    user = User.objects.create_user(
        username='admin',
        email=email,
        password=password,
        role='admin',
        display_name='System Administrator',
        is_staff=True,
        is_superuser=True
    )
    print(f"Created new admin user: {user.username} ({user.email}) - Role: {user.role}")