#!/bin/bash

SCRIPT_DIR=`dirname "$0"`
cd $SCRIPT_DIR

NUMBER_OF_INSTANCES=$1

if ! [[ $NUMBER_OF_INSTANCES =~ ^[0-9]+([.][0-9]+)?$ ]] ; then
   echo "error: Not a number param" >&2;
   exit 1
fi

echo "Will configure $NUMBER_OF_INSTANCES number of visitor prosodies"
set -e
set -x

JICOFO_HOSTNAME=$(echo get jitsi-videobridge/jvb-hostname | sudo debconf-communicate jicofo | cut -d' ' -f2-)

# Install SystemD template unit (once, outside loop)
cp prosody-v@.service /usr/lib/systemd/system/prosody-v@.service
systemctl daemon-reload

# Configure prosody instances
for (( i=1 ; i<=${NUMBER_OF_INSTANCES} ; i++ ));
do
    mkdir /etc/prosody-v${i}
    ln -s /etc/prosody/certs /etc/prosody-v${i}/certs
    cp prosody.cfg.lua.visitor.template /etc/prosody-v${i}/prosody.cfg.lua
    sed -i "s/vX/v${i}/g" /etc/prosody-v${i}/prosody.cfg.lua
    sed -i "s/jitmeet.example.com/$JICOFO_HOSTNAME/g" /etc/prosody-v${i}/prosody.cfg.lua
    # fix the ports
    sed -i "s/52691/5269${i}/g" /etc/prosody-v${i}/prosody.cfg.lua
    sed -i "s/52221/5222${i}/g" /etc/prosody-v${i}/prosody.cfg.lua
    sed -i "s/52801/5280${i}/g" /etc/prosody-v${i}/prosody.cfg.lua
    sed -i "s/52811/5281${i}/g" /etc/prosody-v${i}/prosody.cfg.lua
    # Enable and start the systemd instance
    systemctl enable --now prosody-v@${i}.service
done

# Configure jicofo
HOCON_CONFIG="/etc/jitsi/jicofo/jicofo.conf"
hocon -f $HOCON_CONFIG set "jicofo.bridge.selection-strategy" "VisitorSelectionStrategy"
hocon -f $HOCON_CONFIG set "jicofo.bridge.visitor-selection-strategy" "RegionBasedBridgeSelectionStrategy"
hocon -f $HOCON_CONFIG set "jicofo.bridge.participant-selection-strategy" "RegionBasedBridgeSelectionStrategy"
hocon -f $HOCON_CONFIG set "jicofo.bridge.topology-strategy" "VisitorTopologyStrategy"

PASS=$(hocon -f $HOCON_CONFIG get "jicofo.xmpp.client.password")
for (( i=1 ; i<=${NUMBER_OF_INSTANCES} ; i++ ));
do
  prosodyctl --config /etc/prosody-v${i}/prosody.cfg.lua register focus auth.meet.jitsi $PASS
  hocon -f $HOCON_CONFIG set "jicofo.xmpp.visitors.v${i}.enabled" true
  hocon -f $HOCON_CONFIG set "jicofo.xmpp.visitors.v${i}.conference-service" "conference.v${i}.meet.jitsi"
  hocon -f $HOCON_CONFIG set "jicofo.xmpp.visitors.v${i}.hostname" 127.0.0.1
  hocon -f $HOCON_CONFIG set "jicofo.xmpp.visitors.v${i}.port" 5222${i}
  hocon -f $HOCON_CONFIG set "jicofo.xmpp.visitors.v${i}.domain" "auth.meet.jitsi"
  hocon -f $HOCON_CONFIG set "jicofo.xmpp.visitors.v${i}.xmpp-domain" "v${i}.meet.jitsi"
  hocon -f $HOCON_CONFIG set "jicofo.xmpp.visitors.v${i}.password" "${PASS}"
  hocon -f $HOCON_CONFIG set "jicofo.xmpp.visitors.v${i}.disable-certificate-verification" true
done

# Restart all prosody visitor instances
for (( i=1 ; i<=${NUMBER_OF_INSTANCES} ; i++ ));
do
  systemctl restart prosody-v@${i}.service
done
systemctl restart jicofo
