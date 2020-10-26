# nanoStream Meetcaster



The nanoStream Meetcaster allows users to connect online with people in virtual rooms and hold face-to-face meetings. It is possible to stream the conference around the world in 1 second by passing a nanoStream Cloud ingest URL + streamname. 


## Jitsi Meet - Secure, Simple and Scalable Video Conferences

Jitsi Meet is an open-source (Apache) WebRTC JavaScript application that uses [Jitsi Videobridge](https://jitsi.org/videobridge) to provide high quality, [secure](https://jitsi.org/security) and scalable video conferences. Jitsi Meet in action can be seen at [here at the session #482 of the VoIP Users Conference](http://youtu.be/7vFUVClsNh0).

Jitsi Meet allows very efficient collaboration. Users can stream their desktop or only some windows. It also supports shared document editing with Etherpad.


## Usecase



1. All participants are on the same level
2. One participant on focus
   1. All other participants hidden
   2. All other participants as small tiles



[TOC]

## Gettings Started

You can find the project [here](https://github.com/nanocosmos-private/jitsi-meet/tree/develop).



### Web Frontend

The Web Frontend can be used to start the Meetcaster directly from the browser. 

*The Makefile defines a few more options of how this project can be compiled and linked.*



#### Installation

1. `npm install` - Installs the dependencies.

2. `make dev` - Runs the app in development mode. (open `http://localhost:8080/` to view it in the browser)



#### Build

1. `make source-package` - Builds the app for production.

2. `jitsi-meet.tar.bz2` (ZIP file) - The source package for production (unpack file and copy to server  `scp * -r root@conference.nanocosmos.de:/usr/share/jitsi-meet`)
3. `systemctl restart jicofo.service jitsi-videobridge2.service prosody.service` - Restarts and refreshs the server side including the new source package.



##### Update [interface_config.js](https://github.com/jitsi/jitsi-meet/blob/master/interface_config.js)

Gets updated when following the 3 steps above.



##### Update [config.js](https://github.com/jitsi/jitsi-meet/blob/master/config.js)

Needs to be updated manually inside the directory `jitsi-meet-web-config` (copy to server: `scp config.js root@conference.nanocosmos.de:/usr/share/jitsi-meet-web-config`). Then do step 3 (s. above).



#### Usage

On the client side, no installation is necessary, just a JWT token.

To customize data from the global setted [interface_config.js](https://github.com/jitsi/jitsi-meet/blob/master/interface_config.js) and [config.js](https://github.com/jitsi/jitsi-meet/blob/master/config.js) you can add params to the URL.

Example: `[BASE_URL]/[ROOM_NAME]#config.startWithAudioMuted=true`



### External API

The External API can be used to embed the nanoStream Meetcaster.

*The Makefile defines a few more options of how this project can be compiled and linked.*



#### Build

1. `make clean` - Cleans the `build` folder
2. `make compile` - Creates a new `build` folder (Watch out: The server where jets is placed resolves every path as a room )



#### Usage

Read [here](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe) about the IFrame API and have a look [here](#External-API) before using it, if some of these changes affect your planned usage.



**Minimal code snippet**

```html
<script src='https://www-dev1.nanocosmos.de/amatic/api/external_api.min.js'></script>
<div id="nanoStream-meet"></div>
<script>
    const domain = 'conference.nanocosmos.de';
    const streamname='[BINTU-STREAMNAME]'
    const parentNode = document.querySelector('#nanoStream-meet');
    const options = {
        roomName: streamname,
        jwt: "[TOKEN]",
        width: 700,
        height: 700,
        parentNode: parentNode,
    };
    const api = new NanoStreamMeetcaster(domain, options);
</script>
```





## Changes and Customizations

Until now changes have only been made by commenting things out or renaming every occurence of it.



### External API

Please do not forget to take care you rename **every occurence**, if you plan to.



- Object `JitsiMeetExternalAPI` was renamed to`NanoStream Meetcaster` 
  - Occurences:
    - `webpack.config.js`
    - `doc/examples/api.html`
    - `modules/API/constants.js`
    - `modules/API/external/external_api.js`
    - `modules/API/external/index.js`




- Function `startRecording ` (Starts a file recording or streaming session depending on the passed on params)  
  - Occurrence: `modules/API/API.js`
  - `youtubeStreamKey` was renamed to `nanoStreamName`



### Lanuguage

The default language is english (find the file here: `lang/main-enGB.json`). It can be setted up inside the `config.js` and could be changed manually by users inside the [Settings](#Settings). 



### UI



#### Invite People

Can be found here: `react/features/invite/`



- Add People Dialog (find here: `react/features/invite/components/add-people-dialog/web/AddPeopleDialog.js`)
  - Hidden:
    - "Dial in"



#### More Actions Menu

Can be found here: `react/features/toolbox/`



- Toolbox (find here: `react/features/toolbox/components/web/Toolbox.js`)
  - Hidden:
    - "VideoBlurButton"
    - "OverflowMenuItem (Feedback)"
    - "OverflowMenuItem (Embed meeting)"
    - "OverflowMenuItem (Shortcuts)"
    - "OverflowMenuItem (Share YouTube Video)"



#### Settings

Can be found here: ` react/features/settings`



- More Tab (find here: `react/features/settings/components/web/MoreTab.js`)
  - Hidden: 
    - "Choose Language"