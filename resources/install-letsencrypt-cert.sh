#!/bin/bash

set -e

DEB_CONF_RESULT=`debconf-show jitsi-meet-web-config | grep jvb-hostname`
DOMAIN="${DEB_CONF_RESULT##*:}"
# remove whitespace
DOMAIN="$(echo -e "${DOMAIN}" | tr -d '[:space:]')"

echo "-------------------------------------------------------------------------"
echo "This script will:"
echo "- Need a working DNS record pointing to this machine(for domain ${DOMAIN})"
echo "- Download certbot-auto from https://dl.eff.org to /usr/local/sbin"
echo "- Install additional dependencies in order to request Let’s Encrypt certificate"
echo "- If running with jetty serving web content, will stop Jitsi Videobridge"
echo "- Configure and reload nginx or apache2, whichever is used"
echo ""
echo "You need to agree to the ACME server's Subscriber Agreement (https://letsencrypt.org/documents/LE-SA-v1.1.1-August-1-2016.pdf) "
echo "by providing an email address for important account notifications"

echo -n "Enter your email and press [ENTER]: "
read EMAIL

cd /usr/local/sbin

if [ ! -f certbot-auto ] ; then
  wget https://dl.eff.org/certbot-auto
  chmod a+x ./certbot-auto
fi

CRON_FILE="/etc/cron.weekly/letsencrypt-renew"
echo "#!/bin/bash" > $CRON_FILE
echo "/usr/local/sbin/certbot-auto renew >> /var/log/le-renew.log" >> $CRON_FILE

CERT_KEY="/etc/letsencrypt/live/$DOMAIN/privkey.pem"
CERT_CRT="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"

if [ -f /etc/nginx/sites-enabled/$DOMAIN.conf ] ; then

    ./certbot-auto certonly --noninteractive \
    --webroot --webroot-path /usr/share/jitsi-meet \
    -d $DOMAIN \
    --agree-tos --email $EMAIL

    echo "Configuring nginx"

    CONF_FILE="/etc/nginx/sites-available/$DOMAIN.conf"
    CERT_KEY_ESC=$(echo $CERT_KEY | sed 's/\./\\\./g')
    CERT_KEY_ESC=$(echo $CERT_KEY_ESC | sed 's/\//\\\//g')
    sed -i "s/ssl_certificate_key\ \/etc\/jitsi\/meet\/.*key/ssl_certificate_key\ $CERT_KEY_ESC/g" \
        $CONF_FILE
    CERT_CRT_ESC=$(echo $CERT_CRT | sed 's/\./\\\./g')
    CERT_CRT_ESC=$(echo $CERT_CRT_ESC | sed 's/\//\\\//g')
    sed -i "s/ssl_certificate\ \/etc\/jitsi\/meet\/.*crt/ssl_certificate\ $CERT_CRT_ESC/g" \
        $CONF_FILE

    echo "service nginx reload" >> $CRON_FILE
    service nginx reload

elif [ -f /etc/apache2/sites-enabled/$DOMAIN.conf ] ; then

    ./certbot-auto certonly --noninteractive \
    --webroot --webroot-path /usr/share/jitsi-meet \
    -d $DOMAIN \
    --agree-tos --email $EMAIL

    echo "Configuring apache2"

    CONF_FILE="/etc/apache2/sites-available/$DOMAIN.conf"
    CERT_KEY_ESC=$(echo $CERT_KEY | sed 's/\./\\\./g')
    CERT_KEY_ESC=$(echo $CERT_KEY_ESC | sed 's/\//\\\//g')
    sed -i "s/SSLCertificateKeyFile\ \/etc\/jitsi\/meet\/.*key/SSLCertificateKeyFile\ $CERT_KEY_ESC/g" \
        $CONF_FILE
    CERT_CRT_ESC=$(echo $CERT_CRT | sed 's/\./\\\./g')
    CERT_CRT_ESC=$(echo $CERT_CRT_ESC | sed 's/\//\\\//g')
    sed -i "s/SSLCertificateFile\ \/etc\/jitsi\/meet\/.*crt/SSLCertificateFile\ $CERT_CRT_ESC/g" \
        $CONF_FILE

    echo "service apache2 reload" >> $CRON_FILE
    service apache2 reload
else
    service jitsi-videobridge stop

    ./certbot-auto certonly --noninteractive \
    --standalone \
    -d $DOMAIN \
    --agree-tos --email $EMAIL

    echo "Configuring jetty"

    CERT_P12="/etc/jitsi/videobridge/$DOMAIN.p12"
    CERT_JKS="/etc/jitsi/videobridge/$DOMAIN.jks"
    # create jks from  certs
    openssl pkcs12 -export \
        -in $CERT_CRT -inkey $CERT_KEY -passout pass:changeit > $CERT_P12
    keytool -importkeystore -destkeystore $CERT_JKS \
        -srckeystore $CERT_P12 -srcstoretype pkcs12 \
        -noprompt -storepass changeit -srcstorepass changeit

    service jitsi-videobridge start

fi

# the cron file that will renew certificates
chmod a+x $CRON_FILE
