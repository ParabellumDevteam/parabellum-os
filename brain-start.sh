#!/usr/bin/env bash
set -e

cd /root/workspace/parabellum-os
export $(grep -v '^#' .env | xargs)
exec npx tsx apps/api/src/index.ts
