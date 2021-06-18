#!/bin/bash

missing_vars=( )
[ -z "$PUBLIC_URL" ] && missing_vars+=( "PUBLIC_URL" )
[ -z "$GOOGLE_ANALYTICS_ID" ] && missing_vars+=( "GOOGLE_ANALYTICS_ID" )
[ -z "$AMPLITUDE_KEY" ] && missing_vars+=( "AMPLITUDE_KEY" )

if [ ${#missing_vars[@]} -gt 0 ]; then
  echo "Missing environment variables: ${missing_vars[*]}"
  exit 1
fi

# Create config files using templates and env vars
j2 -f env -o /config/nginx/site-confs/meet.conf /config/templates/meet.conf.j2
j2 -f env -o /config/config.js /config/templates/config.js.j2

# Start nginx
exec nginx -c /config/nginx/nginx.conf
