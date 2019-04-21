# Jitsi Meet - Secure, Simple and Scalable Video Conferences

Jitsi Meet is an open-source (Apache) WebRTC JavaScript application that uses [Jitsi Videobridge](https://jitsi.org/videobridge) to provide high quality, [secure](#security) and scalable video conferences. Jitsi Meet in action can be seen at [here at the session #482 of the VoIP Users Conference](http://youtu.be/7vFUVClsNh0).

The Jitsi Meet client runs in your browser, without installing anything on your computer. You can try it out at https://meet.jit.si .

Jitsi Meet allows very efficient collaboration. Users can stream their desktop or only some windows. It also supports shared document editing with Etherpad.

## Installation

On the client side, no installation is necessary. You just point your browser to the URL of your deployment. This section is about installing a Jitsi Meet suite on your server and hosting your own conferencing service.

Installing Jitsi Meet is a simple experience. For Debian-based system, following the [quick-install](https://github.com/jitsi/jitsi-meet/blob/master/doc/quick-install.md) document, which uses the package system. You can also see a demonstration of the process in [this tutorial video](https://jitsi.org/tutorial).

For other systems, or if you wish to install all components manually, see the [detailed manual installation instructions](https://github.com/jitsi/jitsi-meet/blob/master/doc/manual-install.md).

## Download

| Latest stable release | [![release](https://img.shields.io/badge/release-latest-green.svg)](https://github.com/jitsi/jitsi-meet/releases/latest) |
|---|---|

You can download Debian/Ubuntu binaries:
* [stable](https://download.jitsi.org/stable/) ([instructions](https://jitsi.org/downloads/ubuntu-debian-installations-instructions/))
* [testing](https://download.jitsi.org/testing/) ([instructions](https://jitsi.org/downloads/ubuntu-debian-installations-instructions-for-testing/))
* [nightly](https://download.jitsi.org/unstable/) ([instructions](https://jitsi.org/downloads/ubuntu-debian-installations-instructions-nightly/))

You can download source archives (produced by ```make source-package```):
* [source builds](https://download.jitsi.org/jitsi-meet/src/)

You can get our mobile versions from here:
* [Android](https://play.google.com/store/apps/details?id=org.jitsi.meet)
* [iOS](https://itunes.apple.com/us/app/jitsi-meet/id1165103905)

## Building the sources

Node.js >= 10 and npm >= 6 are required.

On Debian/Ubuntu systems, the required packages can be installed with:
```
sudo apt-get install npm nodejs
cd jitsi-meet
npm install
```

To build the Jitsi Meet application, just type
```
make
```

### Working with the library sources (lib-jitsi-meet)

By default the library is build from its git repository sources. The default dependency path in package.json is :
```json
"lib-jitsi-meet": "jitsi/lib-jitsi-meet",
```

To work with local copy you must change the path to:
```json
"lib-jitsi-meet": "file:///Users/name/local-lib-jitsi-meet-copy",
```

To make the project you must force it to take the sources as 'npm update':
```
npm install lib-jitsi-meet --force && make
```

Or if you are making only changes to the library:
```
npm install lib-jitsi-meet --force && make deploy-lib-jitsi-meet
```

Alternative way is to use [npm link](https://docs.npmjs.com/cli/link).
It allows to link `lib-jitsi-meet` dependency to local source in few steps:

```bash
cd lib-jitsi-meet

#### create global symlink for lib-jitsi-meet package
npm link

cd ../jitsi-meet

#### create symlink from the local node_modules folder to the global lib-jitsi-meet symlink
npm link lib-jitsi-meet
```

 After changes in local `lib-jitsi-meet` repository, you can rebuild it with `npm run install` and your `jitsi-meet` repository will use that modified library.
Note: when using node version 4.x, the make file of jitsi-meet do npm update which will delete the link. It is no longer the case with version 6.x.

If you do not want to use local repository anymore you should run
```bash
cd jitsi-meet
npm unlink lib-jitsi-meet
npm install
```
### Running with webpack-dev-server for development

Use it at the CLI, type
```
make dev
```

By default the backend deployment used is `beta.meet.jit.si`. You can point the Jitsi-Meet app at a different backend by using a proxy server. To do this, set the WEBPACK_DEV_SERVER_PROXY_TARGET variable:
```
export WEBPACK_DEV_SERVER_PROXY_TARGET=https://your-example-server.com
make dev
```

The app should be running at https://localhost:8080/

## Contributing

If you are looking to contribute to Jitsi Meet, first of all, thank you! Please
see our [guidelines for contributing](CONTRIBUTING.md).

## Embedding in external applications

Jitsi Meet provides a very flexible way of embedding in external applications by using the [Jitsi Meet API](doc/api.md).

## Security
WebRTC does not provide a way of conducting multi-party conversations with end-to-end encryption. 
Unless you consistently compare DTLS fingerprints with your peers vocally, the same goes for one-to-one calls.
As a result, your stream is encrypted on the network but decrypted on the machine that hosts the bridge when using Jitsi Meet.

The Jitsi Meet architecture allows you to deploy your own version, including
all server components. In that case, your security guarantees will be roughly
equivalent to a direct one-to-one WebRTC call. This is the uniqueness of
Jitsi Meet in terms of security.

The [meet.jit.si](https://meet.jit.si) service is maintained by the Jitsi team
at [8x8](https://8x8.com).

## Mobile app
Jitsi Meet is also available as a React Native app for Android and iOS.
Instructions on how to build it can be found [here](doc/mobile.md).

## Acknowledgements

Jitsi Meet started out as a sample conferencing application using Jitsi Videobridge. It was originally developed by ESTOS' developer Philipp Hancke who then contributed it to the community where development continues with joint forces!
