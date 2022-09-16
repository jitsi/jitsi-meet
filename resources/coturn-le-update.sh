#!/bin/sh

set -e

# This script is updating the Let's Encrypt certificates on renew or when installing
# The only param it gets is the domain and expects the certificates to use are updated
# in /etc/jitsi/meet folder.
DOMAIN=$1

if [ -z "$DOMAIN" ] ; then
  echo "You need to pass the domain as parameter."
  exit 10;
fi

COTURN_CERT_DIR="/etc/coturn/certs"
TURN_CONFIG="/etc/turnserver.conf"

# Execute only if turnconfig exist and is one managed by jitsi-meet
if [ -f $TURN_CONFIG ] && grep -q "jitsi-meet coturn config" "$TURN_CONFIG" ; then
    # create a directory to store certs if it does not exists
    if [ ! -d "$COTURN_CERT_DIR" ]; then
        mkdir -p $COTURN_CERT_DIR
        chown -R turnserver:turnserver /etc/coturn/
        chmod -R 700 /etc/coturn/
    fi

    # Make sure the certificate and private key files are
    # never world readable, even just for an instant while
    # we're copying them into daemon_cert_root.
    umask 077

    cp "/etc/jitsi/meet/${DOMAIN}.crt" "$COTURN_CERT_DIR/${DOMAIN}.fullchain.pem"
    cp "/etc/jitsi/meet/${DOMAIN}.key" "$COTURN_CERT_DIR/${DOMAIN}.privkey.pem"

    # Apply the proper file ownership and permissions for
    # the daemon to read its certificate and key.
    chown turnserver "$COTURN_CERT_DIR/${DOMAIN}.fullchain.pem" \
            "$COTURN_CERT_DIR/${DOMAIN}.privkey.pem"
    chmod 400 "$COTURN_CERT_DIR/${DOMAIN}.fullchain.pem" \
            "$COTURN_CERT_DIR/${DOMAIN}.privkey.pem"

    echo "Configuring turnserver"
    sed -i "/^cert/c\cert=\/etc\/coturn\/certs\/${DOMAIN}.fullchain.pem" $TURN_CONFIG
    sed -i "/^pkey/c\pkey=\/etc\/coturn\/certs\/${DOMAIN}.privkey.pem" $TURN_CONFIG

    service coturn restart
fi
