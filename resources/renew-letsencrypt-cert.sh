#!/bin/bash

set -e

#
# This script is executed once a Let’s Encrypt certificate had been renewed
# we reload web servers or in case of jetty we restart jvb
# In future we need to implement reloading jvb, which will reload the jetty
#

DEB_CONF_RESULT=`debconf-show jitsi-meet-web-config | grep jvb-hostname`
DOMAIN="${DEB_CONF_RESULT##*:}"
# remove whitespace
DOMAIN="$(echo -e "${DOMAIN}" | tr -d '[:space:]')"

if [ -f /etc/nginx/sites-enabled/$DOMAIN.conf ] ; then
    service nginx reload
elif [ -f /etc/apache2/sites-enabled/$DOMAIN.conf ] ; then
    service apache2 reload
else
    PIDFILE=/var/run/jitsi-videobridge.pid
    if [ -f $PIDFILE ]; then
        PID=$(cat $PIDFILE)

        /usr/share/jitsi-videobridge/graceful_shutdown.sh $PID || true
    fi

    service jitsi-videobridge restart
fi