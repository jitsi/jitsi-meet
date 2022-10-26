# Jitsi Meet We.Team 

## Get the Jitsi Meet source

Clone our fork of the Jitsi Meet repository:

https://github.com/otixo-inc/jitsi-meet

## Developing

Follow this guide for instuctions on how to run jitsi-meet in development mode

https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-web


## Releasing

### Build the package

Run the following command to create a source package:

```sh
make && make source-package
```

### Create a GitHub Release

Visit https://github.com/otixo-inc/jitsi-meet/releases and create a new release and include jitsi-meet.tar.bz2 as a release asset.

## Synching our fork with the Jitsi origin

If we want to include new Jitsi features in our fork, we need to rebase the jitsi origin branch on to our `master` branch.

Find the latest Jitsi release here: https://github.com/jitsi/jitsi-meet/releases

The release should be tagged. e.g. `stable/jitsi-meet_7882`

You should rebase this branch on to our `master` branch.