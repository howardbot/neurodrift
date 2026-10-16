#!/bin/sh
# Roles: "api" (migrate, then serve) or "worker" (RQ worker). Anything else is exec'd.
set -e
case "$1" in
  api)
    alembic upgrade head
    exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1 --proxy-headers \
      --forwarded-allow-ips='*' --no-access-log
    ;;
  worker)
    exec rq worker --url "$REDIS_URL" neurodrift
    ;;
  *)
    exec "$@"
    ;;
esac
