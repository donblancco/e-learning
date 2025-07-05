from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from .health_check import health_check, health_check_detailed

urlpatterns = [
    # Django admin disabled for API-only application
    # path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/questions/', include('questions.urls')),
    path('api/progress/', include('progress.urls')),
    path('api/admin/', include('questions.admin_urls')),
    # Health check endpoints
    path('api/health/', health_check, name='health_check'),
    path('api/health/detailed/', health_check_detailed, name='health_check_detailed'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
