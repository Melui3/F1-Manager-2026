import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# ✅ auto-create superuser (safe)
try:
    from .auto_superuser import ensure_superuser
    ensure_superuser()
except Exception as e:
    print("[auto_superuser] skipped:", e)

application = get_wsgi_application()