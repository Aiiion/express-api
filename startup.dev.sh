#!/bin/sh
set -e

DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-5432}
MAX_DB_WAIT_SECONDS=${MAX_DB_WAIT_SECONDS:-90}


echo "Waiting for Postgres at ${DB_HOST}:${DB_PORT}..."
SECONDS_WAITED=0
until pg_isready -h "$DB_HOST" -p "$DB_PORT" >/dev/null 2>&1; do
	if [ "$SECONDS_WAITED" -ge "$MAX_DB_WAIT_SECONDS" ]; then
		echo "Postgres did not become available within $MAX_DB_WAIT_SECONDS seconds"
		exit 1
	fi
	echo "Postgres is unavailable - sleeping"
	sleep 1
	SECONDS_WAITED=$((SECONDS_WAITED + 1))
done

echo "Postgres is available, running migrations and starting app in development mode"
npm run migrate
exec npx nodemon --legacy-watch ./src/index.mjs
