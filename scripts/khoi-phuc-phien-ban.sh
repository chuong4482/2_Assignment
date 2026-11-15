#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
if [ ! -s .previous-release-tag ]; then echo 'No previous release recorded' >&2; exit 1; fi
IMAGE_TAG=$(cat .previous-release-tag)
case "$IMAGE_TAG" in *[!a-zA-Z0-9._-]*|'') echo 'Invalid rollback tag' >&2; exit 1;; esac
export IMAGE_TAG
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --wait api web
printf '%s\n' "$IMAGE_TAG" > .release-tag
# Database is not rolled back automatically; use a backup for incompatible migrations.
