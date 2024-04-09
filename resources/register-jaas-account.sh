#!/bin/bash

set -e

EMAIL=$1
DOMAIN=$2

if [ -z "${DOMAIN}" ] || [ -z "${EMAIL}" ]; then
    echo "You need to provide email and domain as parameters."
    exit 1
fi

JITSI_INSTALLATION="DEBIAN"
JAAS_ENDPOINT="https://account-provisioning.cloudflare.jitsi.net/operations"
CHALLENGE_FILE="/usr/share/jitsi-meet/.well-known/jitsi-challenge.txt"
SUPPORT_MSG="Reach out to JaaS support or retry with /usr/share/jitsi-meet/scripts/register-jaas-account.sh"

create_error=0
create_data=$(curl -s -f -X 'POST' "${JAAS_ENDPOINT}" -H 'Content-Type: application/json' -H 'accept: */*' \
  -d "{ \"domain\": \"${DOMAIN}\", \"email\": \"${EMAIL}\", \"jitsiInstallation\": \"${JITSI_INSTALLATION}\" }") || create_error=$?
if [ ${create_error} -ne 0 ]; then
    echo "Account creation failed. Status: ${create_error}, response: ${create_data}"
    exit 2
fi

# make sure .well-known exists
mkdir -p "$(dirname "$CHALLENGE_FILE")"
# Creating the challenge file
echo "${create_data}" | jq -r .challenge > ${CHALLENGE_FILE}

op_id=$(echo "${create_data}" | jq -r .operationId)
ready_error=0
ready_data=$(curl -s -f -X 'PUT' "${JAAS_ENDPOINT}/${op_id}/ready") || ready_error=$?
if [ ${ready_error} -ne 0 ]; then
    echo "Validating domain failed. Status: ${ready_error}"
    echo "Response: "
    echo "${ready_data}" | jq -r
    echo "${SUPPORT_MSG}"
    echo
    exit 3
fi

SLEEP_TIME=0
WAIT_BEFORE_CHECK=10
TIMEOUT=60
echo -n "Creating..."
(while true; do
    provisioned_data=$(curl -s -f "${JAAS_ENDPOINT}/${op_id}")

    status=$(echo "${provisioned_data}" | jq -r .status)

    if [ "${status}" == "PROVISIONED" ]; then
        echo ""
        echo "=================="
        echo ""
        echo "JaaS account was created. To finish setup follow the email that was sent."
        echo ""
        echo "=================="
        exit 0;
    elif  [ "${status}" == "FAILED" ]; then
        echo ""
        echo "=================="
        echo ""
        echo "JaaS account creation failed:${provisioned_data}"
        echo ""
        echo "=================="
        exit 4
    elif  [ "${status}" == "VERIFIED" ] && [ "${verified}" != "true" ]; then
        echo -n "Account was successfully verified..."
        verified="true"
    fi

    if [ ${SLEEP_TIME} -ge ${TIMEOUT} ]; then
        echo ""
        echo "=================="
        echo ""
        echo "Timeout creating account. ${SUPPORT_MSG}"
        echo ""
        echo "=================="
        exit 5
    fi

    echo -n "waiting..."
    sleep ${WAIT_BEFORE_CHECK}
    SLEEP_TIME=$((SLEEP_TIME+WAIT_BEFORE_CHECK))
done)

rm ${CHALLENGE_FILE} || true
