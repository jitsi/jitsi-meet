#!/bin/bash

set -e

echo "-------------------------------------------------------------------------"
echo "This script will:"
echo "- Need a working DNS record pointing to this machine(for hostname ${DOMAIN})"
echo "- Install additional dependencies in order to request Let’s Encrypt certificate (acme.sh)"
echo "- Configure and reload nginx or apache2, whichever is used"
echo "- Configure the coturn server to use Let's Encrypt certificate and add required deploy hooks"
echo "- Configure renew of certificate"
echo ""

EMAIL=$1

if [ -z "$EMAIL" ]; then
  echo "You need to agree to the ACME server's Subscriber Agreement (https://letsencrypt.org/documents/LE-SA-v1.1.1-August-1-2016.pdf) "
  echo "by providing an email address for important account notifications"

  echo -n "Enter your email and press [ENTER]: "
  read EMAIL
fi

DOMAIN=$2
if [ -z "$DOMAIN" ]; then
  DEB_CONF_RESULT=$(debconf-show jitsi-meet-web-config | grep jitsi-meet/jvb-hostname)
  DOMAIN="${DEB_CONF_RESULT##*:}"
fi
# remove whitespace
DOMAIN="$(echo -e "${DOMAIN}" | tr -d '[:space:]')"


export HOME=/opt/acmesh
curl https://get.acme.sh | sh -s email=$EMAIL

# Checks whether nginx or apache is installed
NGINX_INSTALL_CHECK="$(dpkg-query -f '${Status}' -W 'nginx' 2>/dev/null | awk '{print $3}' || true)"
NGINX_FULL_INSTALL_CHECK="$(dpkg-query -f '${Status}' -W 'nginx-full' 2>/dev/null | awk '{print $3}' || true)"
NGINX_EXTRAS_INSTALL_CHECK="$(dpkg-query -f '${Status}' -W 'nginx-extras' 2>/dev/null | awk '{print $3}' || true)"
OPENRESTY_INSTALL_CHECK="$(dpkg-query -f '${Status}' -W 'openresty' 2>/dev/null | awk '{print $3}' || true)"
APACHE_INSTALL_CHECK="$(dpkg-query -f '${Status}' -W 'apache2' 2>/dev/null | awk '{print $3}' || true)"

RELOAD_CMD=""
if [ "$NGINX_INSTALL_CHECK" = "installed" ] || [ "$NGINX_INSTALL_CHECK" = "unpacked" ] \
   || [ "$NGINX_FULL_INSTALL_CHECK" = "installed" ] || [ "$NGINX_FULL_INSTALL_CHECK" = "unpacked" ] \
   || [ "$NGINX_EXTRAS_INSTALL_CHECK" = "installed" ] || [ "$NGINX_EXTRAS_INSTALL_CHECK" = "unpacked" ]; then
    RELOAD_CMD="systemctl force-reload nginx.service"
elif [ "$OPENRESTY_INSTALL_CHECK" = "installed" ] || [ "$OPENRESTY_INSTALL_CHECK" = "unpacked" ] ; then
    RELOAD_CMD="systemctl force-reload openresty.service"
elif [ "$APACHE_INSTALL_CHECK" = "installed" ] || [ "$APACHE_INSTALL_CHECK" = "unpacked" ] ; then
    RELOAD_CMD="systemctl force-reload apache2.service"
else
    RELOAD_CMD="echo 'No webserver found'"
fi

RELOAD_CMD+=" && /usr/share/jitsi-meet/scripts/coturn-le-update.sh ${DOMAIN}"

ISSUE_FAILED_CODE=0
ISSUE_CERT_CMD="/opt/acmesh/.acme.sh/acme.sh -f --issue -d ${DOMAIN} -w /usr/share/jitsi-meet --server letsencrypt"
eval "${ISSUE_CERT_CMD}" || ISSUE_FAILED_CODE=$?

INSTALL_CERT_CMD="/opt/acmesh/.acme.sh/acme.sh -f --install-cert -d ${DOMAIN} --key-file /etc/jitsi/meet/${DOMAIN}.key --fullchain-file /etc/jitsi/meet/${DOMAIN}.crt --reloadcmd \"${RELOAD_CMD}\""
if [ ${ISSUE_FAILED_CODE} -ne 0 ] ; then
    # it maybe this certificate already exists (code 2 - skip, no need to renew)
    if [ ${ISSUE_FAILED_CODE} -eq 2 ]; then
        eval "$INSTALL_CERT_CMD"
    else
        echo "Issuing the certificate from Let's Encrypt failed, continuing ..."
        echo "You can retry later by executing:"
        echo "/usr/share/jitsi-meet/scripts/install-letsencrypt-cert.sh $EMAIL"
    fi
else
    eval "$INSTALL_CERT_CMD"
fi
