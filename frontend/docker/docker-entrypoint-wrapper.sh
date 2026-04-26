#!/bin/sh
# Compose sets API_URL to 1, 2, or 3 (see docker-compose.yml). Export the real
# upstream for nginx template envsubst, then hand off to the stock nginx entrypoint.
# Optional: set NGINX_API_UPSTREAM directly to skip numeric mapping.

set -e

if [ -n "$NGINX_API_UPSTREAM" ]; then
  exec /docker-entrypoint.sh "$@"
fi

case "${API_URL:-2}" in
  1)
    export NGINX_API_UPSTREAM="${NGINX_API_UPSTREAM:-http://host.docker.internal:8080/api}"
    ;;
  2)
    export NGINX_API_UPSTREAM="${NGINX_API_UPSTREAM:-https://api.jobrythm.aricummings.com/api}"
    ;;
  3)
    export NGINX_API_UPSTREAM="${NGINX_API_UPSTREAM:-https://api.jobrythm.com/api}"
    ;;
  *)
    export NGINX_API_UPSTREAM="${NGINX_API_UPSTREAM:-https://api.jobrythm.aricummings.com/api}"
    ;;
esac

exec /docker-entrypoint.sh "$@"
