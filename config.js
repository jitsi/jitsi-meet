var config = {
    hosts: {
        domain: 'hristo.jitsi.net',
        //anonymousdomain: 'guest.example.com',
//        anonymousdomain: 'guest.hristo.jitsi.net',
        muc: 'conference.hristo.jitsi.net', // FIXME: use XEP-0030
        bridge: 'jitsi-videobridge.hristo.jitsi.net', // FIXME: use XEP-0030
        //jirecon: 'jirecon.jitsi-meet.example.com',
        //call_control: 'callcontrol.jitsi-meet.example.com',
        //focus: 'focus.jitsi-meet.example.com' - defaults to 'focus.jitsi-meet.example.com'
    },
//  getroomnode: function (path) { return 'someprefixpossiblybasedonpath'; },
//  useStunTurn: true, // use XEP-0215 to fetch STUN and TURN server
//  useIPv6: true, // ipv6 support. use at your own risk
    useNicks: false,
    bosh: '//hristo.jitsi.net/http-bind', // FIXME: use xep-0156 for that
    clientNode: 'http://jitsi.org/jitsimeet', // The name of client node advertised in XEP-0115 'c' stanza
    //focusUserJid: 'focus@auth.jitsi-meet.example.com', // The real JID of focus participant - can be overridden here
    defaultSipNumber: '123', // Default SIP number
    desktopSharing: 'ext', // Desktop sharing method. Can be set to 'ext', 'webrtc' or false to disable.
//    resolution: "1080",
    chromeExtensionId: 'diibjkoicjeejcmhdnailmkgecihlobk', // Id of desktop streamer Chrome extension
    desktopSharingSources: ['screen', 'window'],
    minChromeExtVersion: '0.1', // Required version of Chrome extension
    openSctp: true, // Toggle to enable/disable SCTP channels
    disableStats: false,
    disableAudioLevels: false,
    channelLastN: -1, // The default value of the channel attribute last-n.
    adaptiveLastN: false,
    adaptiveSimulcast: false,
    useRtcpMux: false,
    useBundle: false,
    enableRecording: true,
    enableWelcomePage: true,
    enableSimulcast: false,
    enableFirefoxSupport: false, //firefox support is still experimental, only one-to-one conferences with chrome focus
    // will work when simulcast, bundle, mux, lastN and SCTP are disabled.
    logStats: false // Enable logging of PeerConnection stats via the focus
};
