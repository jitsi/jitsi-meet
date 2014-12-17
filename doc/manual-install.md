# Server Installation for Jitsi Meet

This describes configuring a server `jitsi.example.com`.  You will need to
change references to that to match your host, and generate some passwords for
`YOURSECRET1` and `YOURSECRET2`.

There are also some complete [example config files](https://github.com/jitsi/jitsi-meet/tree/master/doc/example-config-files/) available, mentioned in each section.

## Install prosody and otalk modules
```sh
apt-get install lsb-release
echo deb http://packages.prosody.im/debian $(lsb_release -sc) main | sudo tee -a /etc/apt/sources.list
wget --no-check-certificate https://prosody.im/files/prosody-debian-packages.key -O- | sudo apt-key add -
apt-get update
apt-get install prosody-trunk
apt-get install git lua-zlib lua-sec-prosody lua-dbi-sqlite3 liblua5.1-bitop-dev liblua5.1-bitop0
git clone https://github.com/andyet/otalk-server.git
cd otalk-server
cp -r mod* /usr/lib/prosody/modules
```

## Configure prosody
Modify the config file in `/etc/prosody/prosody.cfg.lua` (see also the example config file):

- modules to enable/add: compression, bosh, smacks, carbons, mam, lastactivity, offline, pubsub, adhoc, websocket, http_altconnect
- comment out: `c2s_require_encryption = true`, and `s2s_secure_auth = false`
- change `authentication = "internal_hashed"`
- add this:
```
daemonize = true
cross_domain_bosh = true;
storage = {archive2 = "sql2"}
sql = { driver = "SQLite3", database = "prosody.sqlite" }
default_archive_policy = "roster"
```
- configure your domain by editing the example.com virtual host section section:
```
VirtualHost "jitsi.example.com"
authentication = "anonymous"
ssl = {
    key = "/var/lib/prosody/jitsi.example.com.key";
    certificate = "/var/lib/prosody/jitsi.example.com.crt";
}
```
- and finally configure components:
```
Component "conference.jitsi.example.com" "muc"
Component "jitsi-videobridge.jitsi.example.com"
    component_secret = "YOURSECRET1"
```

Generate certs for the domain:
```sh
prosodyctl cert generate jitsi.example.com
```

Restart prosody XMPP server with the new config
```sh
prosodyctl restart
```

## Install nginx
```sh
apt-get install nginx
```

Add nginx config for domain in `/etc/nginx/nginx.conf`:
```
tcp_nopush on;
types_hash_max_size 2048;
server_names_hash_bucket_size 64;
```

Add a new file `jitsi.example.com` in `/etc/nginx/sites-available` (see also the example config file):
```
server {
    listen 80;
    server_name jitsi.example.com;
    # set the root
    root /srv/jitsi.example.com;
    index index.html;
    location ~ ^/([a-zA-Z0-9]+)$ {
        rewrite ^/(.*)$ / break;
    }
    # BOSH
    location /http-bind {
        proxy_pass      http://localhost:5280/http-bind;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header Host $http_host;
    }
    # xmpp websockets
    location /xmpp-websocket {
        proxy_pass http://localhost:5280;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        tcp_nodelay on;
    }
}
```

Add link for the added configuration
```sh
cd /etc/nginx/sites-enabled
ln -s ../sites-available/jitsi.example.com jitsi.example.com
```

## Fix firewall if needed
```sh
ufw allow 80
ufw allow 5222
```

## Install Jitsi Videobridge
```sh
wget https://download.jitsi.org/jitsi-videobridge/linux/jitsi-videobridge-linux-{arch-buildnum}.zip
unzip jitsi-videobridge-linux-{arch-buildnum}.zip
```

Install JRE if missing:
```
apt-get install default-jre
```

In the user home that will be starting Jitsi Videobridge create `.sip-communicator` folder and add the file `sip-communicator.properties` with one line in it:
```
org.jitsi.impl.neomedia.transform.srtp.SRTPCryptoContext.checkReplay=false
```

Start the videobridge with:
```sh
./jvb.sh --host=localhost --domain=jitsi.example.com --port=5347 --secret=YOURSECRET1 &
```
Or autostart it by adding the line in `/etc/rc.local`:
```sh
/bin/bash /root/jitsi-videobridge-linux-{arch-buildnum}/jvb.sh --host=localhost --domain=jitsi.example.com --port=5347 --secret=YOURSECRET1 </dev/null >> /var/log/jvb.log 2>&1
```

## Deploy Jitsi Meet
Checkout and configure Jitsi Meet:
```sh
cd /srv
git clone https://github.com/jitsi/jitsi-meet.git
mv jitsi-meet/ jitsi.example.com
```

Edit host names in `/srv/jitsi.example.com/config.js` (see also the example config file):
```
var config = {
    hosts: {
        domain: 'jitsi.example.com',
        muc: 'conference.jitsi.example.com',
        bridge: 'jitsi-videobridge.jitsi.example.com'
    },
    useNicks: false,
    bosh: '//jitsi.example.com/http-bind', // FIXME: use xep-0156 for that
    desktopSharing: 'false' // Desktop sharing method. Can be set to 'ext', 'webrtc' or false to disable.
    //chromeExtensionId: 'diibjkoicjeejcmhdnailmkgecihlobk', // Id of desktop streamer Chrome extension
    //minChromeExtVersion: '0.1' // Required version of Chrome extension
};
```

Restart nginx to get the new configuration:
```sh
invoke-rc.d nginx restart
```


## Install [Turn server](https://github.com/andyet/otalk-server/tree/master/restund)
```sh
apt-get install make gcc
wget http://creytiv.com/pub/re-0.4.7.tar.gz
tar zxvf re-0.4.7.tar.gz
ln -s re-0.4.7 re
cd re-0.4.7
sudo make install PREFIX=/usr
cd ..
wget http://creytiv.com/pub/restund-0.4.2.tar.gz
wget https://raw.github.com/andyet/otalk-server/master/restund/restund-auth.patch
tar zxvf restund-0.4.2.tar.gz
cd restund-0.4.2/
patch -p1 < ../restund-auth.patch
sudo make install PREFIX=/usr
cp debian/restund.init /etc/init.d/restund
chmod +x /etc/init.d/restund
cd /etc
wget https://raw.github.com/andyet/otalk-server/master/restund/restund.conf
```

Configure addresses and ports as desired, and the password to be configured in prosody:
```
realm           jitsi.example.com
# share this with your prosody server
auth_shared     YOURSECRET2

# modules
module_path     /usr/lib/restund/modules
turn_relay_addr [turn ip address]
```

Configure prosody to use it in `/etc/prosody/prosody.cfg.lua`.  Add to your virtual host:
```
turncredentials_secret = "YOURSECRET2";
turncredentials = {
    { type = "turn", host = "turn.address.ip.configured", port = 3478, transport = "tcp" }
}
```

Add turncredentials module in the "modules_enabled" section

Reload prosody if needed
```
prosodyctl restart
```

## Running behind NAT
In case of videobridge being installed on a machine behind NAT, add the following extra lines to the file `~/.sip-communicator/sip-communicator.properties` (in the home of user running the videobridge):
```
org.jitsi.videobridge.NAT_HARVESTER_LOCAL_ADDRESS=<Local.IP.Address>
org.jitsi.videobridge.NAT_HARVESTER_PUBLIC_ADDRESS=<Public.IP.Address>
```

So the file should look like this at the end:
```
org.jitsi.impl.neomedia.transform.srtp.SRTPCryptoContext.checkReplay=false
org.jitsi.videobridge.NAT_HARVESTER_LOCAL_ADDRESS=<Local.IP.Address>
org.jitsi.videobridge.NAT_HARVESTER_PUBLIC_ADDRESS=<Public.IP.Address>
```

# Hold your first conference
You are now all set and ready to have your first meet by going to http://jitsi.example.com


## Enabling recording
Currently recording is only supported for linux-64 and macos. To enable it, add
the following properties to sip-communicator.properties:
```
org.jitsi.videobridge.ENABLE_MEDIA_RECORDING=true
org.jitsi.videobridge.MEDIA_RECORDING_PATH=/path/to/recordings/dir
org.jitsi.videobridge.MEDIA_RECORDING_TOKEN=secret
```

where /path/to/recordings/dir is the path to a pre-existing directory where recordings
will be stored (needs to be writeable by the user running jitsi-videobridge),
and "secret" is a string which will be used for authentication.

Then, edit the Jitsi-Meet config.js file and set:
```
enableRecording: true
```

Restart jitsi-videobridge and start a new conference (making sure that the page
is reloaded with the new config.js) -- the organizer of the conference should
now have a "recoriding" button in the floating menu, near the "mute" button.
