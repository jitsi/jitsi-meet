Jitsi Meet - Secure, Simple and Scalable Video Conferences 
====
Jitsi Meet is an open-source (Apache) WebRTC JavaScript application that uses [Jitsi Videobridge](https://jitsi.org/videobridge) to provide high quality, scalable video conferences. You can see [Jitsi Meet in action](http://youtu.be/7vFUVClsNh0) here at the session #482 of the VoIP Users Conference.

You can also try it out yourself at https://meet.jit.si .

Jitsi Meet allows for very efficient collaboration. It allows users to stream their desktop or only some windows. It also supports shared document editing with Etherpad and remote presentations with Prezi. 

## Installation

Installing Jitsi Meet is quite a simple experience. For Debian-based systems, we recommend following the [quick-install](https://github.com/jitsi/jitsi-meet/blob/master/doc/quick-install.md) document, which uses the package system.

For other systems, or if you wish to install all components manually, see the [detailed manual installation instructions](https://github.com/jitsi/jitsi-meet/blob/master/doc/manual-install.md).

## Building the sources

Jitsi Meet uses [Browserify](http://browserify.org). If you want to make changes in the code you need to [install Browserify](http://browserify.org/#install). Browserify requires [nodejs](http://nodejs.org). 

On Debian/Ubuntu systems, the required packages can be installed with:
```
sudo apt-get install npm
sudo npm install -g browserify
cd jitsi-meet
npm install
```

To build the Jitsi Meet application, just type
```
make
```

## Discuss
Please use the [Jitsi dev mailing list](http://lists.jitsi.org/pipermail/dev/) to discuss feature requests before opening an issue on Github. 

## Acknowledgements

Jitsi Meet started out as a sample conferencing application using Jitsi Videobridge. It was originally developed by then ESTOS' developer Philipp Hancke who then contributed it to the community where development continues with joint forces! 
