# Server Installation for Jitsi Meet


:warning: **WARNING:** Manual installation is not recommended. We recommend following the [quick-install](https://github.com/jitsi/jitsi-meet/blob/master/doc/quick-install.md) document. The current document describes the steps that are needed to install a working deployment, but steps are easy to mess up, and the debian packages are more up-to-date, where this document sometimes is not updated to latest changes.



This describes configuring a server `jitsi.example.com` running Debian or a Debian Derivative. You will need to
change references to that to match your host, and generate some passwords for
`YOURSECRET1`, `YOURSECRET2` and `YOURSECRET3`.

There are also some complete [example config files](https://github.com/jitsi/jitsi-meet/tree/master/doc/example-config-files/) available, mentioned in each section.

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
               | NginX |                       |
               |       |                       |
               +--+-+--+                       |
                  | |                          |
+------------+    | |    +--------------+      |
|            |    | |    |              |      |
| jitsi-meet +<---+ +--->+ prosody/xmpp |      |
|            |files 5280 |              |      |
+------------+           +--------------+      v
                     5222,5347^    ^5347      4443
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

## Install nginx
```sh
apt-get install nginx
```

Add a new file `jitsi.example.com` in `/etc/nginx/sites-available` (see also the example config file):
```
server_names_hash_bucket_size 64;

server {
    listen 443;
    # tls configuration that is not covered in this guide
    # we recommend the use of https://certbot.eff.org/
    server_name jitsi.example.com;
    # set the root
    root /srv/jitsi.example.com;
    index index.html;
    location ~ ^/([a-zA-Z0-9=\?]+)$ {
        rewrite ^/(.*)$ / break;
    }
    location / {
        ssi on;
    }
    # BOSH
    location /http-bind {
        proxy_pass      http://localhost:5280/http-bind;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header Host $http_host;
    }
}
```

Add link for the added configuration
```sh
cd /etc/nginx/sites-enabled
ln -s ../sites-available/jitsi.example.com jitsi.example.com
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

_NOTE: When installing on older Debian releases keep in mind that you need JRE >= 1.7._

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

## Install Jitsi Conference Focus (jicofo)

Install JDK and Maven if missing:
```
apt-get install default-jdk maven
```

_NOTE: When installing on older Debian releases keep in mind that you need JDK >= 1.7._

Clone source from Github repo:
```sh
git clone https://github.com/jitsi/jicofo.git
```
Build distribution package. Replace {os-name} with one of: 'lin', 'lin64', 'macosx', 'win', 'win64'.
```sh
cd jicofo
mvn package -DskipTests -Dassembly.skipAssembly=false
```
Run jicofo:
```sh
=======
unzip target/jicofo-{os-name}-1.0-SNAPSHOT.zip
cd jicofo-{os-name}-1.0-SNAPSHOT'
./jicofo.sh --host=localhost --domain=jitsi.example.com --secret=YOURSECRET2 --user_domain=auth.jitsi.example.com --user_name=focus --user_password=YOURSECRET3
```

## Deploy Jitsi Meet
Checkout and configure Jitsi Meet:
```sh
cd /srv
git clone https://github.com/jitsi/jitsi-meet.git
mv jitsi-meet/ jitsi.example.com
npm install
make
```

Edit host names in `/srv/jitsi.example.com/config.js` (see also the example config file):
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

Restart nginx to get the new configuration:
```sh
invoke-rc.d nginx restart
```

## Running behind NAT
Jitsi-Videobridge can run behind a NAT, provided that all required ports are routed (forwarded) to the machine that it runs on. By default these ports are (TCP/443 or TCP/4443 and UDP 10000-20000).

The following extra lines need to be added the file `~/.sip-communicator/sip-communicator.properties` (in the home directory of the user running the videobridge):
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
[Jibri](https://github.com/jitsi/jibri)is a set of tools for recording and/or streaming a Jitsi Meet conference.
