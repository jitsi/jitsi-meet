/* jshint maxlen:false */

var config = { // eslint-disable-line no-unused-vars
//    configLocation: './config.json', // see ./modules/HttpConfigFetch.js
    hosts: {
        domain: 'jitsi-meet.example.com',
        //anonymousdomain: 'guest.example.com',
        //authdomain: 'jitsi-meet.example.com',  // defaults to <domain>
        muc: 'conference.jitsi-meet.example.com', // FIXME: use XEP-0030
        //jirecon: 'jirecon.jitsi-meet.example.com',
        //call_control: 'callcontrol.jitsi-meet.example.com',
        //focus: 'focus.jitsi-meet.example.com', // defaults to 'focus.jitsi-meet.example.com'
    },
//  getroomnode: function (path) { return 'someprefixpossiblybasedonpath'; },
//  useStunTurn: true, // use XEP-0215 to fetch STUN and TURN server
//  useIPv6: true, // ipv6 support. use at your own risk
    useNicks: false,
    bosh: '//jitsi-meet.example.com/http-bind', // FIXME: use xep-0156 for that
    clientNode: 'http://jitsi.org/jitsimeet', // The name of client node advertised in XEP-0115 'c' stanza
    //focusUserJid: 'focus@auth.jitsi-meet.example.com', // The real JID of focus participant - can be overridden here
    //defaultSipNumber: '', // Default SIP number

    // The STUN servers that will be used in the peer to peer connections
    p2pStunServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" }
    ],

    // The ID of the jidesha extension for Chrome.
    desktopSharingChromeExtId: null,
    // Whether desktop sharing should be disabled on Chrome.
    desktopSharingChromeDisabled: true,
    // The media sources to use when using screen sharing with the Chrome
    // extension.
    desktopSharingChromeSources: ['screen', 'window', 'tab'],
    // Required version of Chrome extension
    desktopSharingChromeMinExtVersion: '0.1',

    // The ID of the jidesha extension for Firefox. If null, we assume that no
    // extension is required.
    desktopSharingFirefoxExtId: null,
    // Whether desktop sharing should be disabled on Firefox.
    desktopSharingFirefoxDisabled: true,
    // The maximum version of Firefox which requires a jidesha extension.
    // Example: if set to 41, we will require the extension for Firefox versions
    // up to and including 41. On Firefox 42 and higher, we will run without the
    // extension.
    // If set to -1, an extension will be required for all versions of Firefox.
    desktopSharingFirefoxMaxVersionExtRequired: 51,
    // The URL to the Firefox extension for desktop sharing.
    desktopSharingFirefoxExtensionURL: null,

    // Disables ICE/UDP by filtering out local and remote UDP candidates in signalling.
    webrtcIceUdpDisable: false,
    // Disables ICE/TCP by filtering out local and remote TCP candidates in signalling.
    webrtcIceTcpDisable: false,

    openSctp: true, // Toggle to enable/disable SCTP channels
    disableStats: false,
    disableAudioLevels: false,
    channelLastN: -1, // The default value of the channel attribute last-n.
    enableRecording: false,
    enableWelcomePage: true,
    //enableClosePage: false, // enabling the close page will ignore the welcome
                              // page redirection when call is hangup
    disableSimulcast: false,
    logStats: false, // Enable logging of PeerConnection stats via the focus
//    requireDisplayName: true, // Forces the participants that doesn't have display name to enter it when they enter the room.
//    startAudioMuted: 10, // every participant after the Nth will start audio muted
//    startVideoMuted: 10, // every participant after the Nth will start video muted
//    defaultLanguage: "en",
// To enable sending statistics to callstats.io you should provide Applicaiton ID and Secret.
//    callStatsID: "", // Application ID for callstats.io API
//    callStatsSecret: "", // Secret for callstats.io API
    /*noticeMessage: 'Service update is scheduled for 16th March 2015. ' +
    'During that time service will not be available. ' +
    'Apologise for inconvenience.',*/
    disableThirdPartyRequests: false,
    minHDHeight: 540,
    // If true - all users without token will be considered guests and all users
    // with token will be considered non-guests. Only guests will be allowed to
    // edit their profile.
    enableUserRolesBasedOnToken: false,
    // Suspending video might cause problems with audio playback. Disabling until these are fixed.
    disableSuspendVideo: true,
    // disables or enables RTX (RFC 4588) (defaults to false).
    disableRtx: false,
    // Sets the preferred resolution (height) for local video. Defaults to 360.
    resolution: 720,
    // Enables peer to peer mode. When enabled system will try to establish
    // direct connection given that there are exactly 2 participants in
    // the room. If that succeeds the conference will stop sending data through
    // the JVB and use the peer to peer connection instead. When 3rd participant
    // joins the conference will be moved back to the JVB connection.
    //enableP2P: true
    // How long we're going to wait, before going back to P2P after
    // the 3rd participant has left the conference (to filter out page reload)
    //backToP2PDelay: 5
};
