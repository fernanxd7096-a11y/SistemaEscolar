#!/bin/sh
set -e

PORT="${PORT:-80}"
echo "Iniciando backend escolar en puerto ${PORT}..."

mkdir -p /run/nginx /var/log/supervisor /var/www/html/storage/framework/views /var/www/html/storage/framework/cache /var/www/html/storage/framework/sessions /var/www/html/storage/logs
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

sed -i "s/listen [0-9]\+;/listen ${PORT};/g" /etc/nginx/http.d/default.conf

if [ -n "$APP_KEY" ]; then
    php artisan config:clear || true
    php artisan route:clear || true
    php artisan view:clear || true
fi

exec /usr/bin/supervisord -n -c /etc/supervisor/conf.d/supervisord.conf