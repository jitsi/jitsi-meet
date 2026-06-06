JWT_KID=$(cat /etc/jitsi/token-generator/config | grep  SYSTEM_ASAP_BASE_URL_MAPPINGS | cut -d= -f2- | jq -r .[].kid)
JWT_DATE=$(echo -n $JWT_KID | cut -d/ -f2-)
JWT_DATE=${JWT_DATE#jwt-}
KEY_FILE=/etc/jitsi/token-generator/daily-key
echo -n "set \$jaas_asap_key " > ${KEY_FILE}
ASAP_KEY=$(ASAP_SIGNING_KEY_FILE=/etc/jitsi/token-generator/asap-${JWT_DATE}.key ASAP_JWT_KID="${JWT_KID}" ASAP_EXPIRES_IN="1 day" node /usr/share/token-generator/jwt.js| tail -n1)
echo -n "${ASAP_KEY};" >> ${KEY_FILE}

service nginx reload
