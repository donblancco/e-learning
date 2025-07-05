#!/usr/bin/env python
"""
Reset admin user password script
"""
import os
import sys
import django

# Django設定の初期化
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'elearning.settings.production')
django.setup()

from accounts.models import User

def reset_admin_password():
    try:
        # 管理者ユーザーを取得
        admin_user = User.objects.get(email='admin@example.com')
        
        # パスワードを「password123」にリセット
        admin_user.set_password('new_secure_password')
        admin_user.save()
        
        print(f"Admin user password reset successfully")
        print(f"User: {admin_user.email}")
        print(f"New password: new_secure_password")
        
        # 認証テスト
        from django.contrib.auth import authenticate
        test_user = authenticate(username=admin_user.username, password='new_secure_password')
        print(f"Authentication test: {'SUCCESS' if test_user else 'FAILED'}")
        
    except User.DoesNotExist:
        print("Admin user not found")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    reset_admin_password()