# Setup server

* Provision machine on exoscale

```
docker-machine create --driver exoscale \
  --exoscale-api-key=<key> \
  --exoscale-api-secret-key=<secret> \
  --exoscale-availability-zone CH-DK-2 \
  --exoscale-disk-size 10 \
  --exoscale-image ubuntu-18.04 \
  --exoscale-instance-profile Small \
  --exoscale-ssh-key <path-to-ssh-key> \
  --exoscale-ssh-user ubuntu \
  jitsi-meet
  ```

* Set up firewall rules in exoscale according to https://github.com/jitsi/docker-jitsi-meet#external-ports

* Setup config directories in exoscale instance

`mkdir -p ~/.jitsi-meet-config/{web/letsencrypt,transcripts,prosody,jicofo,jvb,jigasi,jibri}`

* Make sure `.env` is configured correctly

* Set env variables to connect docker to instance on exoscale

`eval $(docker-machine env jitsi-meet)`

* Deploy docker container

`docker-compose up -d`

# Deploy client

* Create zip file of the source package

`make source-package`

* Copy file source package to exoscale instance

`scp jitsi-meet.tar.bz2 <user>@<ip>`

* Unzip in exoscale instance

`tar -xf jitsi-meet.tar.bz2`
