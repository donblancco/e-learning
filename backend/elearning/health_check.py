"""
Health check views for production monitoring
"""

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.db import connection
from django.core.cache import cache
import time


@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    """
    Basic health check endpoint
    """
    return JsonResponse({
        'status': 'healthy',
        'timestamp': time.time()
    })


@csrf_exempt
@require_http_methods(["GET"])
def health_check_detailed(request):
    """
    Detailed health check with database and cache checks
    """
    status = 'healthy'
    checks = {
        'database': False,
        'cache': False
    }
    
    # Database check
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
        checks['database'] = True
    except Exception:
        status = 'unhealthy'
        checks['database'] = False
    
    # Cache check
    try:
        cache.set('health_check', 'test', 30)
        if cache.get('health_check') == 'test':
            checks['cache'] = True
        else:
            checks['cache'] = False
            status = 'unhealthy'
    except Exception:
        status = 'unhealthy'
        checks['cache'] = False
    
    return JsonResponse({
        'status': status,
        'checks': checks,
        'timestamp': time.time()
    })