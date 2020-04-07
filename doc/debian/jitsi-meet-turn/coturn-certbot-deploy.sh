#!/bin/sh

set -e

COTURN_CERT_DIR="/etc/coturn/certs"
TURN_CONFIG="/etc/turnserver.conf"

# create a directory to store certs if it does not exists
if [ ! -d "$COTURN_CERT_DIR" ]; then
    mkdir -p $COTURN_CERT_DIR
    chown -R turnserver:turnserver /etc/coturn/
    chmod -R 700 /etc/coturn/
fi

# This is a template and when copied to /etc/letsencrypt/renewal-hooks/deploy/
# during creating the Let's encrypt certs script
# jitsi-meet.example.com will be replaced with the real domain of deployment
for domain in $RENEWED_DOMAINS; do
        case $domain in
        jitsi-meet.example.com)
                # Make sure the certificate and private key files are
                # never world readable, even just for an instant while
                # we're copying them into daemon_cert_root.
                umask 077

                cp "$RENEWED_LINEAGE/fullchain.pem" "$COTURN_CERT_DIR/$domain.fullchain.pem"
                cp "$RENEWED_LINEAGE/privkey.pem" "$COTURN_CERT_DIR/$domain.privkey.pem"

                # Apply the proper file ownership and permissions for
                # the daemon to read its certificate and key.
                chown turnserver "$COTURN_CERT_DIR/$domain.fullchain.pem" \
                        "$COTURN_CERT_DIR/$domain.privkey.pem"
                chmod 400 "$COTURN_CERT_DIR/$domain.fullchain.pem" \
                        "$COTURN_CERT_DIR/$domain.privkey.pem"

                if [ -f $TURN_CONFIG ] && grep -q "jitsi-meet coturn config" "$TURN_CONFIG" ; then
                    echo "Configuring turnserver"
                    sed -i "/^cert/c\cert=\/etc\/coturn\/certs\/${domain}.fullchain.pem" $TURN_CONFIG
                    sed -i "/^pkey/c\pkey=\/etc\/coturn\/certs\/${domain}.privkey.pem" $TURN_CONFIG
                fi
                service coturn restart
                ;;
        esac
done

