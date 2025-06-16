#!/bin/bash

set -e

PRIVATE_KEY=$1
JAAS_KEY_ID=$2

if [ ! -f "${PRIVATE_KEY}" ] ; then
  echo "You need to specify a correct path for the private key as a first argument."
  exit 1;
fi

if [[ ! "${JAAS_KEY_ID}" =~ ^vpaas-magic-cookie-[0-9a-z]+/[0-9a-z]+$ ]]; then
    echo "Invalid key id passed as a second argument."
    exit 2;
fi

command -v node >/dev/null 2>&1 || { echo >&2 "You must install node first, go to https://nodejs.org. Aborting."; exit 4; }

NODE_VER=$(node -v);
NODE_MAJOR_VER=$(echo ${NODE_VER:1} |  cut -d. -f1);

if [ "$NODE_MAJOR_VER" -lt "18" ]; then
    echo "Please install latest LTS version of node (18+)";
    exit 3;
fi

# we need this util for debconf-set-selections
sudo apt install debconf-utils

# Let's pre-set some settings for token-generator
cat << EOF | sudo debconf-set-selections
token-generator token-generator/private-key string ${PRIVATE_KEY}
token-generator token-generator/kid  string ${JAAS_KEY_ID}
EOF

apt install token-generator

mkdir -p /etc/jitsi/meet/jaas

VPAAS_COOKIE=$(echo -n ${JAAS_KEY_ID}| cut -d/ -f1)
cp /usr/share/jitsi-meet-web-config/nginx-jaas.conf /etc/jitsi/meet/jaas
sed -i "s/jaas_magic_cookie/${VPAAS_COOKIE}/g" /etc/jitsi/meet/jaas/nginx-jaas.conf

cp /usr/share/jitsi-meet-web-config/8x8.vc-config.js /etc/jitsi/meet/jaas/
echo "set \$config_js_location /etc/jitsi/meet/jaas/8x8.vc-config.js;" >> /etc/jitsi/meet/jaas/jaas-vars
echo "set \$custom_index index-jaas.html;" >> /etc/jitsi/meet/jaas/jaas-vars

ln -s /usr/share/jitsi-meet-web-config/index-jaas.html /usr/share/jitsi-meet/index-jaas.html

# let's create the daily key now
/usr/share/jitsi-meet/scripts/update-asap-daily.sh

# let's add to cron daily the update of the asap key
if [ -d /etc/cron.daily ]; then
  ln -s /usr/share/jitsi-meet/scripts/update-asap-daily.sh /etc/cron.daily/update-jaas-asap.sh
else
  echo "No /etc/cron.daily. Please add to your cron jobs to execute as root daily the script: /usr/share/jitsi-meet/scripts/update-asap-daily.sh"
fi
