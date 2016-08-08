/* jshint -W101 */
var config = {
        hosts: {
            domain: 'nik.jitsi.net',

            muc: 'conference.nik.jitsi.net', // FIXME: use XEP-0030
            focus: 'focus.nik.jitsi.net'
        },
        disableSimulcast: false,
        resolution: 1080,
        externalConnectUrl: '//nik.jitsi.net/http-pre-bind',
        useStunTurn: false, // use XEP-0215 to fetch STUN and TURN server
        useIPv6: false, // ipv6 support. use at your own risk
        useNicks: false,
        bosh: '//nik.jitsi.net/http-bind', // FIXME: use xep-0156 for that
        etherpad_base: 'https://nik.jitsi.net/etherpad/p/',
        clientNode: 'http://jitsi.org/jitsimeet', // The name of client node advertised in XEP-0115 'c' stanza
        desktopSharing: 'ext', // Desktop sharing method. Can be set to 'ext', 'webrtc' or false to disable.
        chromeExtensionId: 'diibjkoicjeejcmhdnailmkgecihlobk', // Id of desktop streamer Chrome extension
        desktopSharingSources: ['screen', 'window'],
        minChromeExtVersion: '0.1.3', // Required version of Chrome extension
        desktopSharingFirefoxExtId: "jidesha@meet.jit.si",
        desktopSharingFirefoxDisabled: false,
        desktopSharingFirefoxMaxVersionExtRequired: -1,
        desktopSharingFirefoxExtensionURL: "https://nik.jitsi.net/jidesha-0.1.1-fx.xpi",
        enableRtpStats: false, // Enables RTP stats processing
        openSctp: true, // Toggle to enable/disable SCTP channels
        channelLastN: -1, // The default value of the channel attribute last-n.
        minHDHeight: 540,
        startBitrate: "800",
        adaptiveLastN: false,
        disableAudioLevels: false,
        useRtcpMux: true,
        useBundle: true,
        enableLipSync: true,
        stereo: false,

        hiddenDomain: 'recorder.nik.jitsi.net',
        enableRecording: true,
        requireDisplayName: false,
        recordingType: 'jibri',
        enableWelcomePage: true,
        isBrand: false,
        logStats: false,
// To enable sending statistics to callstats.io you should provide Applicaiton ID and Secret.
        callStatsID: "549114654",//Application ID for callstats.io API
        callStatsSecret: "OR5A7uDh06AhIg287rbyA5jyzDg=",//Secret for callstats.io API
        startAudioMuted: 9,
        startVideoMuted: 9,
        sphinxURL: "http://nik.jitsi.net/recognize-"
};
