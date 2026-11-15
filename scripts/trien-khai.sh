#!/bin/sh
# Run on the target Linux VPS, from the directory containing .env.production.
set -eu
cd "$(dirname "$0")/.."
tag=${1:?Usage: sh scripts/trien-khai.sh IMAGE_TAG}
case "$tag" in *[!a-zA-Z0-9._-]*|'') echo 'Invalid image tag' >&2; exit 1;; esac
export IMAGE_TAG="$tag"
compose() { docker compose --env-file .env.production -f docker-compose.prod.yml "$@"; }
# Snapshot before any fallible step; never use a stale rollback target.
if [ -f .release-tag ]; then cp .release-tag .previous-release-tag; else rm -f .previous-release-tag; fi
compose pull
compose up -d --wait db
# Migrations must be backward compatible: old API keeps serving if this fails.
compose run --rm --no-deps api npx prisma migrate deploy
compose up -d --wait api web
printf '%s\n' "$tag" > .release-tag
