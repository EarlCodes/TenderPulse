#!/bin/sh
set -e

echo "Waiting for PostgreSQL at ${POSTGRES_HOST}:${POSTGRES_PORT}..."

until pg_isready -h "${POSTGRES_HOST:-db}" -p "${POSTGRES_PORT:-5432}" -U "${POSTGRES_USER:-tenderlink}" >/dev/null 2>&1; do
  echo "Postgres is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is up - running migrations"
python manage.py migrate --noinput

echo "Starting scheduled OCDS ingestion in the background (8x per day)..."
(
  # Run immediately on container start
  while true; do
    echo "[ingest_ocds] $(date -Iseconds): Triggering OCDS ingestion..."
    python manage.py ingest_ocds || echo "[ingest_ocds] $(date -Iseconds): Ingestion failed"
    echo "[ingest_ocds] $(date -Iseconds): Sleeping for 3 hours..."
    sleep 10800  # 3 hours
  done
) &

echo "Starting Django development server"
python manage.py runserver 0.0.0.0:8000

