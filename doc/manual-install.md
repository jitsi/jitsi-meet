# Server Installation for Jitsi Meet

:warning: **WARNING:** Manual installation is not recommended. We recommend following the [quick-install](https://github.com/jitsi/jitsi-meet/blob/master/doc/quick-install.md) document. The current document describes the steps that are needed to install a working deployment, but steps are easy to mess up, and the debian packages are more up-to-date, where this document is sometimes not updated to reflect latest changes.

This describes configuring a server `jitsi.example.com` running Debian or a Debian Derivative. You will need to
change references to that to match your host, and generate some passwords for
`YOURSECRET1`, `YOURSECRET2` and `YOURSECRET3`.

There are also some complete [example config files](https://github.com/jitsi/jitsi-meet/tree/master/doc/example-config-files/) available, mentioned in each section.

There are additional configurations to be done for a [scalable installation](https://github.com/jitsi/jitsi-meet/tree/master/doc/scalable-installation.md)

## Network description

This is how the network looks:
```
                   +                           +
                   |                           |
                   |                           |
                   v                           |
                  443                          |
               +-------+                       |
               |       |                       |
               | Nginx |                       |
               |       |                       |
               +--+-+--+                       |
                  | |                          |
+------------+    | |    +--------------+      |
|            |    | |    |              |      |
| jitsi-meet +<---+ +--->+ prosody/xmpp |      |
|            |files 5280 |              |      |
+------------+           +--------------+      v
                     5222,5347^    ^5347   4443,10000
                +--------+    |    |    +-------------+
                |        |    |    |    |             |
                | jicofo +----^    ^----+ videobridge |
                |        |              |             |
                +--------+              +-------------+
```

## Install prosody
```sh
apt-get install prosody
```

## Configure prosody
Add config file in `/etc/prosody/conf.avail/jitsi.example.com.cfg.lua` :

- add your domain virtual host section:

```
VirtualHost "jitsi.example.com"
    authentication = "anonymous"
    ssl = {
        key = "/var/lib/prosody/jitsi.example.com.key";
        certificate = "/var/lib/prosody/jitsi.example.com.crt";
    }
    modules_enabled = {
        "bosh";
        "pubsub";
    }
    c2s_require_encryption = false
```
- add domain with authentication for conference focus user:
```
VirtualHost "auth.jitsi.example.com"
    ssl = {
        key = "/var/lib/prosody/auth.jitsi.example.com.key";
        certificate = "/var/lib/prosody/auth.jitsi.example.com.crt";
    }
    authentication = "internal_plain"
```
- add focus user to server admins:
```
admins = { "focus@auth.jitsi.example.com" }
```
- and finally configure components:
```
Component "conference.jitsi.example.com" "muc"
Component "jitsi-videobridge.jitsi.example.com"
    component_secret = "YOURSECRET1"
Component "focus.jitsi.example.com"
    component_secret = "YOURSECRET2"
```

Add link for the added configuration
```sh
ln -s /etc/prosody/conf.avail/jitsi.example.com.cfg.lua /etc/prosody/conf.d/jitsi.example.com.cfg.lua
```

Generate certs for the domain:
```sh
prosodyctl cert generate jitsi.example.com
prosodyctl cert generate auth.jitsi.example.com
```

Add auth.jitsi.example.com to the trusted certificates on the local machine:
```sh
ln -sf /var/lib/prosody/auth.jitsi.example.com.crt /usr/local/share/ca-certificates/auth.jitsi.example.com.crt
update-ca-certificates -f
```
Note that the `-f` flag is necessary if there are symlinks left from a previous installation.

Create conference focus user:
```sh
prosodyctl register focus auth.jitsi.example.com YOURSECRET3
```

Restart prosody XMPP server with the new config
```sh
prosodyctl restart
```

## Install Nginx
```sh
apt-get install nginx
```

Add a new file `jitsi.example.com` in `/etc/nginx/sites-available` (see also the example config file):
```
server_names_hash_bucket_size 64;

server {
    listen 0.0.0.0:443 ssl http2;
    listen [::]:443 ssl http2;
    # tls configuration that is not covered in this guide
    # we recommend the use of https://certbot.eff.org/
    server_name jitsi.example.com;
    # set the root
    root /srv/jitsi-meet;
    index index.html;
    location ~ ^/([a-zA-Z0-9=\?]+)$ {
        rewrite ^/(.*)$ / break;
    }
    location / {
        ssi on;
    }
    # BOSH, Bidirectional-streams Over Synchronous HTTP
    # https://en.wikipedia.org/wiki/BOSH_(protocol)
    location /http-bind {
        proxy_pass      http://localhost:5280/http-bind;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header Host $http_host;
    }
    # external_api.js must be accessible from the root of the
    # installation for the electron version of Jitsi Meet to work
    # https://github.com/jitsi/jitsi-meet-electron
    location /external_api.js {
        alias /srv/jitsi-meet/libs/external_api.min.js;
    }
}
```

Add link for the added configuration
```sh
cd /etc/nginx/sites-enabled
ln -s ../sites-available/jitsi.example.com jitsi.example.com
```

## Install Jitsi Videobridge
Visit https://download.jitsi.org/jitsi-videobridge/linux to determine the current build number, download and unzip it:
```sh
wget https://download.jitsi.org/jitsi-videobridge/linux/jitsi-videobridge-linux-{arch-buildnum}.zip
unzip jitsi-videobridge-linux-{arch-buildnum}.zip
```

Install JRE if missing:
```
apt-get install openjdk-8-jre
```

_NOTE: When installing on older Debian releases keep in mind that you need JRE >= 1.7._

Create `~/.sip-communicator/sip-communicator.properties` in the home folder of the user that will be starting Jitsi Videobridge:
```sh
mkdir -p ~/.sip-communicator
cat > ~/.sip-communicator/sip-communicator.properties << EOF
org.jitsi.impl.neomedia.transform.srtp.SRTPCryptoContext.checkReplay=false
# The videobridge uses 443 by default with 4443 as a fallback, but since we're already
# running nginx on 443 in this example doc, we specify 4443 manually to avoid a race condition
org.jitsi.videobridge.TCP_HARVESTER_PORT=4443
EOF
```

Start the videobridge with:
```sh
./jvb.sh --host=localhost --domain=jitsi.example.com --port=5347 --secret=YOURSECRET1 &
```
Or autostart it by adding the line in `/etc/rc.local`:
```sh
/bin/bash /root/jitsi-videobridge-linux-{arch-buildnum}/jvb.sh --host=localhost --domain=jitsi.example.com --port=5347 --secret=YOURSECRET1 </dev/null >> /var/log/jvb.log 2>&1
```

## Install Jitsi Conference Focus (jicofo)

Install JDK and Maven if missing:
```
apt-get install openjdk-8-jdk maven
```

_NOTE: When installing on older Debian releases keep in mind that you need JDK >= 1.7._

Clone source from Github repo:
```sh
git clone https://github.com/jitsi/jicofo.git
```
Build the package.
```sh
cd jicofo
mvn package -DskipTests -Dassembly.skipAssembly=false
```
Run jicofo:
```sh
=======
unzip target/jicofo-1.1-SNAPSHOT-archive.zip
cd jicofo-1.1-SNAPSHOT-archive'
./jicofo.sh --host=localhost --domain=jitsi.example.com --secret=YOURSECRET2 --user_domain=auth.jitsi.example.com --user_name=focus --user_password=YOURSECRET3
```

## Deploy Jitsi Meet
Checkout and configure Jitsi Meet:
```sh
cd /srv
git clone https://github.com/jitsi/jitsi-meet.git
cd jitsi-meet
npm install
make
```

_NOTE: When installing on older distributions keep in mind that you need Node.js >= 10 and npm >= 6._

Edit host names in `/srv/jitsi-meet/config.js` (see also the example config file):
```
var config = {
    hosts: {
        domain: 'jitsi.example.com',
        muc: 'conference.jitsi.example.com',
        bridge: 'jitsi-videobridge.jitsi.example.com',
        focus: 'focus.jitsi.example.com'
    },
    useNicks: false,
    bosh: '//jitsi.example.com/http-bind', // FIXME: use xep-0156 for that
    //chromeExtensionId: 'diibjkoicjeejcmhdnailmkgecihlobk', // Id of desktop streamer Chrome extension
    //minChromeExtVersion: '0.1' // Required version of Chrome extension
};
```

Verify that nginx config is valid and reload nginx:
```sh
nginx -t && nginx -s reload
```

## Running behind NAT
Jitsi Videobridge can run behind a NAT, provided that both required ports are routed (forwarded) to the machine that it runs on. By default these ports are `TCP/4443` and `UDP/10000`.

If you do not route these two ports, Jitsi Meet will only work with video for two people, breaking upon 3 or more people trying to show video.

`TCP/443` is required for the webserver which can be running on another machine than the Jitsi Videobrige is running on.

The following extra lines need to be added to the file `~/.sip-communicator/sip-communicator.properties` (in the home directory of the user running the videobridge):
```
org.ice4j.ice.harvest.NAT_HARVESTER_LOCAL_ADDRESS=<Local.IP.Address>
org.ice4j.ice.harvest.NAT_HARVESTER_PUBLIC_ADDRESS=<Public.IP.Address>
```

# Hold your first conference
You are now all set and ready to have your first meet by going to http://jitsi.example.com

## Enabling recording
[Jibri](https://github.com/jitsi/jibri) is a set of tools for recording and/or streaming a Jitsi Meet conference.
