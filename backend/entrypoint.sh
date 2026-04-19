#!/bin/sh
set -e

echo "▶ Applying database migrations..."
python manage.py migrate --noinput

echo "▶ Checking seed status..."
python manage.py shell -c "
from f1.models import Driver
if not Driver.objects.exists():
    print('Empty database — seeding F1 data...')
    from django.core.management import call_command
    call_command('seeds_f1')
    print('Seed complete.')
else:
    print('Database already has data — skipping seed.')
"

echo "▶ Creating admin user (if DJANGO_SU_NAME is set)..."
python manage.py create_default_admin

echo "▶ Starting gunicorn on port ${PORT:-8000}..."
exec gunicorn config.wsgi:application \
    --bind "0.0.0.0:${PORT:-8000}" \
    --workers "${GUNICORN_WORKERS:-2}" \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
