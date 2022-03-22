#!/bin/bash

missing_vars=( )
[ -z "$PUBLIC_URL" ] && missing_vars+=( "PUBLIC_URL" )
[ -z "$GOOGLE_ANALYTICS_ID" ] && missing_vars+=( "GOOGLE_ANALYTICS_ID" )
[ -z "$AMPLITUDE_KEY" ] && missing_vars+=( "AMPLITUDE_KEY" )
[ -z "$VIDEO_STREAM_LIMIT" ] && missing_vars+=( "VIDEO_STREAM_LIMIT" )

if [ ${#missing_vars[@]} -gt 0 ]; then
  echo "Missing environment variables: ${missing_vars[*]}"
  exit 1
fi

# Create config file using templates and env vars
envsubst < /config/templates/config.js.tmpl > /config/config.js

# Start nginx
exec nginx -c /config/nginx/nginx.conf
