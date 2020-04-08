# Scalable Jitsi installation

A single server Jitsi installation is good for a limited size of concurrent conferences.
The first limiting factor is the videobridge component, that handles the actual video and audio traffic.
It is easy to scale the video bridges horizontally by adding as many as needed.
In a cloud based environment, additionally the bridges can be scaled up or down as needed.

*NB*: The [Youtube Tutorial on Scaling](https://www.youtube.com/watch?v=LyGV4uW8km8) is outdated and describes an old configuration method.

*NB*: Building a scalable infrastructure is not a task for beginning Jitsi Administrators.
The instructions assume that you have installed a single node version successfully, and that
you are comfortable installing, configuring and debugging Linux software.
This is not a step-by-step guide, but will show you, which packages to install and which
configurations to change. Use the [manual install](https://github.com/jitsi/jitsi-meet/blob/master/doc/manual-install.md) for
details on how to setup Jitsi on a single host.
It is highly recommended to use configuration management tools like Ansible or Puppet to manage the
installation and configuration.

## Architecture (Single Jitsi-Meet, multiple videobridges)

A first step is to split the functions of the central jitsi-meet instance (with nginx, prosody and jicofo) and
videobridges.

A simplified diagram (with open network ports) of an installation with one Jitsi-Meet instance and three
videobridges that are load balanced looks as follows. Each box is a server/VM.

```
               +                                       +
               |                                       |
               |                                       |
               v                                       v
          80, 443 TCP                          443 TCP, 10000 UDP
       +--------------+                     +---------------------+
       |  nginx       |  5222, 5347 TCP     |                     |
       |  jitsi-meet  |<-------------------+|  jitsi-videobridge  |
       |  prosody     |         |           |                     |
       |  jicofo      |         |           +---------------------+
       +--------------+         |
                                |           +---------------------+
                                |           |                     |
                                +----------+|  jitsi-videobridge  |
                                |           |                     |
                                |           +---------------------+
                                |
                                |           +---------------------+
                                |           |                     |
                                +----------+|  jitsi-videobridge  |
                                            |                     |
                                            +---------------------+
```

## Machine Sizing

The Jitsi-Meet server will generally not have that much load (unless you have many) conferences
going at the same time. A 4 CPU, 8 GB machine will probably be fine.

The videobridges will have more load. 4 or 8 CPU with 8 GB RAM seems to be a good configuration.


### Installation of Jitsi-Meet

Assuming that the installation will run under the following FQDN: `meet.example.com` and you have
SSL cert and key in `/etc/ssl/meet.example.com.{crt,key}`

Set the following DebConf variables prior to installing the packages.
(We are not installing the `jitsi-meet` package which would handle that for us)

Install the `debconf-utils` package

```
$ cat << EOF | sudo debconf-set-selections
jitsi-videobridge	jitsi-videobridge/jvb-hostname	string	meet.example.com
jitsi-meet	jitsi-meet/jvb-serve	boolean	false
jitsi-meet-prosody	jitsi-videobridge/jvb-hostname	string	meet.example.com
jitsi-meet-web-config	jitsi-meet/cert-choice	select	I want to use my own certificate
jitsi-meet-web-config	jitsi-meet/cert-path-crt	string	/etc/ssl/meet.example.com.crt
jitsi-meet-web-config	jitsi-meet/cert-path-key	string	/etc/ssl/meet.example.com.key
EOF
```

On the jitsi-meet server, install the following packages:

* `nginx`
* `prosody`
* `jicofo`
* `jitsi-meet-web`
* `jitsi-meet-prosody`
* `jitsi-meet-web-config`

### Installation of Videobridge(s)

For simplicities sake, set the same `debconf` variables as above and install

* `jitsi-videobridge2`

### Configuration of jitsi-meet

#### Firewall

Open the following ports:

Open to world:

* 80 TCP
* 443 TCP

Open to the videobridges only

* 5222 TCP (for Prosody)
* 5437 TCP (for Jicofo)


#### NGINX

Create the `/etc/nginx/sites-available/meet.example.com.conf` as usual

#### Prosody

Follow the steps in the [manual install](https://github.com/jitsi/jitsi-meet/blob/master/doc/manual-install.md) for setup tasks

You will need to adapt the following files (see the files in `example-config-files/scalable`)

* `/etc/prosody/prosody.cfg.lua`
* `/etc/prosody/conf.avail/meet.example.com.cfg.lua`

#### Jitsi-Meet

Adapt `/usr/share/jitsi-meet/config.js` and `/usr/share/jitsi-meet/interface-config.js` to your specific needs

#### Jicofo

You will need to adapt the following files (see the files in `example-config-files/scalable`)

* `/etc/jitsi/jicofo/config` (hostname, jicofo_secret, jicofo_password)
* `/etc/jitsi/jicofo/sip-communicator.properties` (hostname)

### Configuration of the Videobridge

#### Firewall

Open the following ports:

Open to world:

* 443 TCP
* 10000 UDP

#### jitsi-videobridge2

You will need to adapt the following files (see the files in `example-config-files/scalable`)

Each videobridge will have to have it's own, unique nickname

* `/etc/jitsi/videobridge/config` (hostname, password)
* `/etc/jitsi/jicofo/sip-communicator.properties` (hostname of jitsi-meet, nickname of videobridge, vb_password)

With the latest stable (April 2020) videobridge, it is no longer necessary to set public and private IP
adresses in the `sip-communicator.properties` as the bridge will figure out the correct configuration by itself.

## Testing

After restarting all services (`prosody`, `jicofo` and all the `jitsi-videobridge2`) you can see in
`/var/log/prosody/prosody.log` and
`/var/log/jitsi/jicofo.log` that the videobridges connect to Prososy and that Jicofo picks them up.

When a new conference starts, Jicofo picks a videobridge and schedules the conference on it.
