import re
from django.middleware.csrf import CsrfViewMiddleware
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin
import logging

logger = logging.getLogger(__name__)


class CustomCsrfViewMiddleware(CsrfViewMiddleware):
    """
    Custom CSRF middleware that exempts certain URL patterns
    """
    def process_view(self, request, callback, callback_args, callback_kwargs):
        logger.info(f"CSRF middleware processing: {request.method} {request.path_info}")
        
        if hasattr(settings, 'CSRF_EXEMPT_URLS'):
            for exempt_url in settings.CSRF_EXEMPT_URLS:
                if re.match(exempt_url, request.path_info):
                    logger.info(f"CSRF exempt for URL: {request.path_info} (matched pattern: {exempt_url})")
                    return None
        
        logger.info(f"CSRF check will be performed for URL: {request.path_info}")
        return super().process_view(request, callback, callback_args, callback_kwargs)