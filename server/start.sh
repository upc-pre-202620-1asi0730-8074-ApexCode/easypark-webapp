#!/usr/bin/env bash

cd "$(dirname "$0")"

../node_modules/.bin/json-server \
  --watch db.json \
  --routes routes.json \
  --middlewares authentication.cjs \
  --host 0.0.0.0 \
  --port "${PORT:-3000}"