# Jitsi Meet quick install

This document describes the required steps for a quick Jitsi Meet installation on a Debian based GNU/Linux system. Debian 8 (Jessie) or later, and Ubuntu 14.04 or later are supported out-of-the-box.

Also note that a recent default Ubuntu installation has only the `main` repository enabled, and Jitsi Meet needs packages from `universe`. Check your `/etc/apt/sources.list` file, and if `universe` is not present refer to [Ubuntu's documentation](https://help.ubuntu.com/community/Repositories/Ubuntu) on how to enable it. (Usually it amounts to copying the `main` lines and changing to `universe`.)

N.B.:

a.) All commands are supposed to be run by root. If you are logged in as a regular user with sudo rights, please prepend ___sudo___ to each of the commands.

b.) You only need to do this if you want to ___host your own Jitsi server___. If you just want to have a video conference with someone, use https://meet.jit.si instead.

## Basic Jitsi Meet install

### Set up the Fully Qualified Domain Name (FQDN) (optional)

If the machine used to host the Jitsi Meet instance has a FQDN (for example `meet.example.org`) already set up in DNS, `/etc/hostname` must contain this FQDN; if this is not the case yet, [change the hostname](https://wiki.debian.org/HowTo/ChangeHostname).

Then add the same FQDN in the `/etc/hosts` file, associating it with the loopback address:

    127.0.0.1 localhost meet.example.org

Finally on the same machine test that you can ping the FQDN with: `ping "$(hostname)"`-

### Add the repository
```sh
echo 'deb https://download.jitsi.org stable/' >> /etc/apt/sources.list.d/jitsi-stable.list
wget -qO -  https://download.jitsi.org/jitsi-key.gpg.key | apt-key add -
```

### Update the package lists

```sh
apt-get update
```

If you get an error:
E: The method driver /usr/lib/apt/methods/https could not be found.
run:
```sh
apt-get install apt-transport-https
```

### Install Jitsi Meet

Note: The installer will check if [Nginx](https://nginx.org/) or [Apache](https://httpd.apache.org/) is present (in that order) and configure a virtualhost within the web server it finds to serve Jitsi Meet. If none of the above is found it then defaults to Nginx.

```sh
apt-get -y install jitsi-meet
```

During the installation, you will be asked to enter the hostname of the Jitsi Meet instance. If you have a [FQDN](https://en.wikipedia.org/wiki/Fully_qualified_domain_name) for the instance already set up in DNS, enter it there. If you don't have a resolvable hostname, you can enter the IP address of the machine (if it is static or doesn't change).

This hostname (or IP address) will be used for virtualhost configuration inside the Jitsi Meet and also, you and your correspondents will be using it to access the web conferences.

### Generate a Let's Encrypt certificate

In order to have encrypted communications, you need a [TLS certificate](https://en.wikipedia.org/wiki/Transport_Layer_Security). The easiest way is to use [Let's Encrypt](https://letsencrypt.org/).

Simply run the following in your shell:

```sh
/usr/share/jitsi-meet/scripts/install-letsencrypt-cert.sh
```

Note that this script uses the [HTTP-01 challenge type](https://letsencrypt.org/docs/challenge-types/) and thus your instance needs to be accessible from the public internet. If you want to use a different challenge type, don't use this script and instead choose ___I want to use my own certificate___ during jitsi-meet installation.


#### Advanced configuration
If the installation is on a machine [behind NAT](https://github.com/jitsi/jitsi-meet/blob/master/doc/faq.md) further configuration of jitsi-videobridge is needed in order for it to be accessible from outside.
Provided that all required ports are routed (forwarded) to the machine that it runs on. By default these ports are (TCP/443 or TCP/4443 and UDP/10000).
The following extra lines need to be added the file `/etc/jitsi/videobridge/sip-communicator.properties`:
```
org.ice4j.ice.harvest.NAT_HARVESTER_LOCAL_ADDRESS=<Local.IP.Address>
org.ice4j.ice.harvest.NAT_HARVESTER_PUBLIC_ADDRESS=<Public.IP.Address>
```
See [the documentation of ice4j](https://github.com/jitsi/ice4j/blob/master/doc/configuration.md)
for details.

Default deployments on systems using systemd will have low default values for maximum processes and open files. If the used bridge will expect higher number of participants the default values need to be adjusted (the default values are good for less than 100 participants).
To update the values edit `/etc/systemd/system.conf` and make sure you have the following values:
```
DefaultLimitNOFILE=65000
DefaultLimitNPROC=65000
DefaultTasksMax=65000
```
To load the values and check them look [here](#systemd-details) for details.

By default, anyone who has access to your jitsi instance will be able to start a conference: if your server is open to the world, anyone can have a chat with anyone else. If you want to limit the ability to start a conference to registered users, set up a "secure domain". Follow the instructions at https://github.com/jitsi/jicofo#secure-domain.

### Open a conference

Launch a web browser (Chrome, Chromium or latest Opera) and enter in the URL bar the hostname (or IP address) you used in the previous step.

If you used a self-signed certificate (as opposed to using Let's Encrypt), your web browser will ask you to confirm that you trust the certificate.

Enjoy!

## Adding sip-gateway to Jitsi Meet

### Install Jigasi

Jigasi is a server-side application acting as a gateway to Jitsi Meet conferences. It allows regular [SIP](https://en.wikipedia.org/wiki/Session_Initiation_Protocol) clients to join meetings and provides transcription capabilities.

```sh
apt-get -y install jigasi
```
or

```sh
wget https://download.jitsi.org/unstable/jigasi_1.0-107_amd64.deb
dpkg -i jigasi_1.0-107_amd64.deb
```

During the installation, you will be asked to enter your SIP account and password. This account will be used to invite the other SIP participants.

### Reload Jitsi Meet

Launch again a browser with the Jitsi Meet URL and you'll see a telephone icon on the right end of the toolbar. Use it to invite SIP accounts to join the current conference.

Enjoy!

## Uninstall

```sh
apt-get purge jigasi jitsi-meet jitsi-meet-web-config jitsi-meet-prosody jitsi-meet-turnserver jitsi-meet-web jicofo jitsi-videobridge
```

Sometimes the following packages will fail to uninstall properly:

- jigasi
- jitsi-videobridge

When this happens, just run the uninstall command a second time and it should be ok.

The reason for the failure is that sometimes the uninstall script is faster than the process that stops the daemons. The second run of the uninstall command fixes this, as by then the jigasi or jitsi-videobridge daemons are already stopped.

#### Systemd details
To reload the systemd changes on a running system execute `systemctl daemon-reload` and `service jitsi-videobridge restart`.
To check the tasks part execute `service jitsi-videobridge status` and you should see `Tasks: XX (limit: 65000)`.
To check the files and process part execute ```cat /proc/`cat /var/run/jitsi-videobridge/jitsi-videobridge.pid`/limits``` and you should see:
```
Max processes             65000                65000                processes
Max open files            65000                65000                files
```

## Debugging problems

If you run into problems, one thing to try is using a different web browser. Some versions of some browsers are known to have issues with Jitsi Meet. You can also visit https://test.webrtc.org to test your browser's [WebRTC](https://en.wikipedia.org/wiki/WebRTC) support.

Another place to look is the various log files:

```
/var/log/jitsi/jvb.log
/var/log/jitsi/jicofo.log
/var/log/prosody/prosody.log
```
