# Debian Installation for Jitsi Meet with full IPv6 support, rfc5766-turn-server and encrypted XMPP signaling

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
apt-get install prosody-0.10
apt-get install git lua-zlib lua-sec-prosody lua-dbi-sqlite3 liblua5.1-bitop-dev liblua5.1-bitop0
git clone https://github.com/andyet/otalk-server.git
cd otalk-server
cp -r mod* /usr/lib/prosody/modules
```

## Configure prosody
Modify the config file in `/etc/prosody/prosody.cfg.lua` (see also the example config file):

- modules to enable/add: compression, bosh, smacks, carbons, mam, lastactivity, offline, pubsub, adhoc, websocket, http_altconnect, c2s
- comment out: `s2s_secure_auth = false`
- change `authentication = "internal_hashed"`
- change the ssl block to:
```
ssl = {
    key = "/var/lib/prosody/jitsi.example.com.key";
    certificate = "/var/lib/prosody/jitsi.example.com.crt";
}
```
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

If you want to make a certificate request for a public CA you can issue the following command:
```sh
prosodyctl cert request jitsi.example.com
```
The request file will be `/var/lib/prosody/jitsi.example.com.req`


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
      listen [::]:80 ipv6only=on default_server;
      server_name  jitsi.example.com;
      rewrite ^ https://$http_host$request_uri? permanent;  # force redirect http to https
}

server {
      listen 443;
      listen [::]:443 ipv6only=on default_server;
      add_header Strict-Transport-Security "max-age=31536000; includeSubdomains";
      ssl on;
      ssl_certificate /var/lib/prosody/jitsi.example.com.crt;
      ssl_certificate_key /var/lib/prosody/jitsi.example.com.key;
      server_name jitsi.example.com;
      # global SSL options with Perfect Forward Secrecy (PFS) high strength ciphers
      # first. PFS ciphers are those which start with ECDHE which means (EC)DHE
      # which stands for (Elliptic Curve) Diffie-Hellman Ephemeral.
      ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RS$
      ssl_ecdh_curve secp521r1;
      ssl_prefer_server_ciphers on;
      ssl_protocols TLSv1.2 TLSv1.1 TLSv1;
      ssl_session_timeout 5m;  #SPDY timeout=180sec, keepalive=20sec; connection close=session expires
      ssl_session_cache shared:SSL:12m;

      root /srv/jitsi.example.com;
      index index.html;
      location ~ ^/([a-zA-Z0-9]+)$ {
            rewrite ^/(.*)$ / break;
      }

      # BOSH
      location /http-bind {
            proxy_pass      https://localhost:5281/http-bind;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_set_header Host $http_host;
      }
      # xmpp websockets
      location /xmpp-websocket {
            proxy_pass https://localhost:5281;
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
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
ip6tables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
ip6tables -A INPUT -p tcp --dport 443 -j ACCEPT
iptables -A INPUT -p tcp --dport 3478 -j ACCEPT
ip6tables -A INPUT -p tcp --dport 3478 -j ACCEPT
iptables -A INPUT -p tcp --dport 5222 -j ACCEPT
ip6tables -A INPUT -p tcp --dport 5222 -j ACCEPT
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
./jvb.sh --host=localhost --domain=jitsi.example.com --min-port=10000 --max-port=20000 --port=5347 --secret=YOURSECRET1 > /dev/null 2>&1 &
```
Or autostart it by adding the line in `/etc/rc.local`:
```sh
/bin/bash /root/jitsi-videobridge-linux-{arch-buildnum}/jvb.sh --host=localhost --domain=jitsi.example.com --min-port=10000 --max-port=20000 --port=5347 --secret=YOURSECRET1 </dev/null >> /var/log/jvb.log 2>&1
```

## Fix firewall if needed
```sh
iptables -A INPUT -p udp --dport 10000:20000 -j ACCEPT
ip6tables -A INPUT -p udp --dport 10000:20000 -j ACCEPT
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
        muc: 'conference.jitsi.example.com', // FIXME: use XEP-0030
        bridge: 'jitsi-videobridge.jitsi.example.com' // FIXME: use XEP-0030
    },
//  getroomnode: function (path) { return 'someprefixpossiblybasedonpath'; },
    useStunTurn: true, // use XEP-0215 to fetch STUN and TURN server
    useIPv6: true, // ipv6 support. use at your own risk
    useNicks: false,
    bosh: '//jitsi.example.com/http-bind', // FIXME: use xep-0156 for that
    desktopSharing: 'webrtc', // Desktop sharing method. Can be set to 'ext', 'webrtc' or false to disable.
    resolution: '360',
    etherpad_base: 'https://etherpad.jitsi.net:9001/p/',
//  chromeExtensionId: 'diibjkoicjeejcmhdnailmkgecihlobk', // Id of desktop streamer Chrome extension
//  minChromeExtVersion: '0.1' // Required version of Chrome extension
};
```

Restart nginx to get the new configuration:
```sh
invoke-rc.d nginx restart
```

## Install [rfc5766-turn-server](https://code.google.com/p/rfc5766-turn-server/)
```sh
echo "deb http://ftp.no.debian.org/debian/ jessie main contrib non-free" >> /etc/apt/sources.list.d/jessie.list
aptitude update
aptitude install rfc5766-turn-server
```

In `/etc/turnserver.conf` uncomment/add the following:
```
lt-cred-mech
use-auth-secret
static-auth-secret      YOURSECRET2
realm=jitsi.example.com
cert=/var/lib/prosody/jitsi.example.com.crt
pkey=/var/lib/prosody/jitsi.example.com.key
```

In `/etc/default/rfc5766-turn-server` uncomment this line:
```
TURNSERVER_ENABLED=1
```

Restart rfc5766-turn-server to get the new configuration:
```sh
/etc/init.d/rfc5766-turn-server restart
```

Configure prosody to use it in `/etc/prosody/prosody.cfg.lua`.  Add to your virtual host:
```
turncredentials_secret = "YOURSECRET2";
turncredentials = {
    { type = "turn", host = "jitsi.example.com", port = 3478, transport = "tcp" }
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
You are now all set and ready to have your first meet by going to https://jitsi.example.com

To enable screen sharing go to:
```
chrome://flags/#enable-usermedia-screen-capture
```
Click Enable and restart your browser
