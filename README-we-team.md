# Jitsi Meet We.Team 

## Get the Jitsi Meet source

Clone our fork of the Jitsi Meet repository:

https://github.com/otixo-inc/jitsi-meet

## Developing

Follow this guide for instuctions on how to run jitsi-meet in development mode

https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-web-jitsi-meet

Important: Use node 16+

```
export WEBPACK_DEV_SERVER_PROXY_TARGET=https://meet-105.we.team && make dev
```

## Testing

To test changes on our test server:

### Build the package

Run the following command to create a source package:

```sh
make && make source-package
```

### Copy build to the server manually

For test releases, instead of re-creating the entire infrastructure stack we can copy and install `jitsi-meet.tar.bz2` on the test jitsi server.

Find the jitsi server in AWS e.g. `jitsi-meet-server-test` and copy the connection string:

e.g. `ssh -i "otxSL1.pem" ubuntu@ec2-3-235-151-226.compute-1.amazonaws.com`

Copy the package to the server:

```
scp -i otxSL1.pem jitsi-meet.tar.bz2 ubuntu@ec2-3-235-151-226.compute-1.amazonaws.com:/home/ubuntu
```

Connect to the server:

`ssh -i "otxSL1.pem" ubuntu@ec2-3-235-151-226.compute-1.amazonaws.com`

```sh
# move our package to /tmp
mv jitsi-meet.tar.bz2 /tmp
cd /tmp
# remove the previous installation
rm jitsi-meet-weteam.deb weteamweb/ -rf
```

Run the lines from the following file to install our package:

https://github.com/otixo-inc/Infrastructure/blob/d93b774b1f2e968cc4d13463ed079493fc49c303/jitsi-aws/assets/userdata/jms.sh#L47-L59

Restart the server:

```
/etc/init.d/jicofo restart ; /etc/init.d/prosody restart ; /etc/init.d/nginx restart
```

The server is now running the package built from our source code. 

## Releasing

### Build the package

Run the following command to create a source package:

```sh
make && make source-package
```

### Create a GitHub Release

Visit https://github.com/otixo-inc/jitsi-meet/releases and create a new release and include jitsi-meet.tar.bz2 as a release asset.

### Create the infrastructure

Follow the instructions here to create a new jitsi stack in AWS with latest package:

https://github.com/otixo-inc/Infrastructure/blob/master/jitsi-aws/README.md#create-a-stack

## Synching our fork with the Jitsi origin

If we want to include new Jitsi features in our fork, we need to merge the master origin branch on to our `main` branch.

Find the latest Jitsi release here: https://github.com/jitsi/jitsi-meet/releases

The release should be tagged. e.g. `stable/jitsi-meet_7882`

You should merge this branch with our `main` branch.