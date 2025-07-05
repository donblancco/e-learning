#!/usr/bin/env python
"""
Script to check Django settings
"""
import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'elearning.settings.production')
django.setup()

print("INSTALLED_APPS:")
for app in settings.INSTALLED_APPS:
    print(f"  - {app}")

print("\nMIDDLEWARE:")
for middleware in settings.MIDDLEWARE:
    print(f"  - {middleware}")

print(f"\nAUTH_USER_MODEL: {settings.AUTH_USER_MODEL}")
print(f"USE_CSRF: {getattr(settings, 'USE_CSRF', 'Not set')}")
print(f"CSRF_COOKIE_NAME: {getattr(settings, 'CSRF_COOKIE_NAME', 'Not set')}")