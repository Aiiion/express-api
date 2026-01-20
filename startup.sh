#!/bin/sh
set -e

# Wait until Postgres is ready (uses pg_isready from postgresql-client)
DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-5432}

echo "Waiting for Postgres at ${DB_HOST}:${DB_PORT}..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" >/dev/null 2>&1; do
	echo "Postgres is unavailable - sleeping"
	sleep 1
done

echo "Postgres is available, running migrations and starting app"
npm run migrate
exec npm start