# Jitsi Meet - Secure, Simple and Scalable Video Conferences

Jitsi Meet is an open-source (Apache) WebRTC JavaScript application that uses [Jitsi Videobridge](https://jitsi.org/videobridge) to provide high quality, [secure](#security) and scalable video conferences. Jitsi Meet in action can be seen at [here at the session #482 of the VoIP Users Conference](http://youtu.be/7vFUVClsNh0).

The Jitsi Meet client runs in your browser, without installing anything else on your computer. You can try it out at https://meet.jit.si.

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

### Mobile apps

* [Android](https://play.google.com/store/apps/details?id=org.jitsi.meet)

[<img src="resources/img/google-play-badge.png" height="50">](https://play.google.com/store/apps/details?id=org.jitsi.meet)

* [Android (F-Droid)](https://f-droid.org/en/packages/org.jitsi.meet/)

[<img src="resources/img/f-droid-badge.png" height="50">](https://f-droid.org/en/packages/org.jitsi.meet/)

* [iOS](https://itunes.apple.com/us/app/jitsi-meet/id1165103905)

[<img src="resources/img/appstore-badge.png" height="50">](https://itunes.apple.com/us/app/jitsi-meet/id1165103905)

You can also sign up for our open beta testing here:

* [Android](https://play.google.com/apps/testing/org.jitsi.meet)
* [iOS](https://testflight.apple.com/join/isy6ja7S)

## Development

For web development see [here](doc/development.md), and for mobile see [here](doc/mobile.md).

## Contributing

If you are looking to contribute to Jitsi Meet, first of all, thank you! Please
see our [guidelines for contributing](CONTRIBUTING.md).

## Embedding in external applications

Jitsi Meet provides a very flexible way of embedding in external applications by using the [Jitsi Meet API](doc/api.md).

## Security

WebRTC does not (yet) provide a way of conducting multi-party conversations with end-to-end encryption. 
Unless you consistently compare DTLS fingerprints with your peers vocally, the same goes for one-to-one calls.
As a result, your stream is encrypted on the network but decrypted on the machine that hosts the bridge when using Jitsi Meet.

The Jitsi Meet architecture allows you to deploy your own version, including
all server components. In that case, your security guarantees will be roughly
equivalent to a direct one-to-one WebRTC call. This is the uniqueness of
Jitsi Meet in terms of security.

The [meet.jit.si](https://meet.jit.si) service is maintained by the Jitsi team
at [8x8](https://8x8.com).

## Security issues

We take security very seriously and develop all Jitsi projects to be secure and safe.

If you find (or simply suspect) a security issue in any of the Jitsi projects, please send us an email to security@jitsi.org.

**We encourage responsible disclosure for the sake of our users, so please reach out before posting in a public space.**

## Acknowledgements

Jitsi Meet started out as a sample conferencing application using Jitsi Videobridge. It was originally developed by ESTOS' developer Philipp Hancke who then contributed it to the community where development continues with joint forces!
