#!/bin/bash -ex

mkdir -p $HOME/jitsi
touch $HOME/jitsi/jicofo.log
chmod $HOME/777 jitsi
chmod $HOME/666 jitsi/jicofo.log

export JICOFO_LOGFILE="jitsi/jicofo.log"
export JICOFO_HOST="localhost"
export JICOFO_HOSTNAME="jitsi"
export JICOFO_PORT"5347"
export JICOFO_SECRET=""
export JICOFO_AUTH_USER="focus"
export JICOFO_AUTH_DOMAIN="auth.virt"
export JICOFO_AUTH_PASSWORD=""

$SNAP/usr/share/jicofo/jicofo.sh --host="$JICOFO_HOST" --domain="$JICOFO_HOST" --port="$JICOFO_PORT" --secret="$JICOFO_SECRET" --user_name="$JICOFO_AUTH_USER" --user_domain="$JICOFO_AUTH_DOMAIN" --user_password="$JICOFO_AUTH_PASSWORD" "$JICOFO_OPTS" | tee -a "${JICOFO_LOGFILE}"
