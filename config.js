var subdomain = "";
if (subdomain) {
    subdomain = subdomain.substr(0,subdomain.length-1).split('.').join('_').toLowerCase() + '.';
}
var config = {
    hosts: {
        domain: 'alpha.jitsi.net',

        muc: 'conference.'+subdomain+'alpha.jitsi.net', // FIXME: use XEP-0030
        focus: 'focus.alpha.jitsi.net',
    },
    disableSimulcast: false,
//    enableRemb: false,
//    enableTcc: true,
    resolution: 720,
    constraints: {
        video: {
            aspectRatio: 16 / 9,
            height: {
                ideal: 720,
                max: 720,
                min: 180
            },
            width: {
                ideal: 1280,
                max: 1280,
                min: 320
            }
        }
    },
    externalConnectUrl: '//alpha.jitsi.net/http-pre-bind',
    analytics: {
	amplitudeAPPKey: "2719ff8976e947a6cc804bd1bb9c9cc6",
        whiteListedEvents: ['rtcstats.trace.onclose', 'conference.joined', 'page.reload.scheduled', 'rejoined', 'transport.stats', 'rtcstats.trace.onclose'],
	rtcstatsEnabled: true,
	rtcstatsUseLegacy: false,
        rtcstatsEndpoint: "wss://rtcstats-server-pilot.jitsi.net/",
        rtcstatsPollInterval: 10000
    },
    p2pStunServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" }
    ],
    //enableP2P: false, // flag to control P2P connections
    // New P2P options
    p2p: {
        enabled: true,
        preferH264: true,
        disableH264: true,
        useStunTurn: true, // use XEP-0215 to fetch STUN and TURN server for the P2P connection
        stunServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" }
        ]
    },
    useStunTurn: true, // use XEP-0215 to fetch STUN and TURN server for the JVB connection
    useIPv6: false, // ipv6 support. use at your own risk
    useNicks: false,
    bosh: '//alpha.jitsi.net/http-bind', // FIXME: use xep-0156 for that

    //etherpad_base: 'https://alpha.jitsi.net/etherpad/p/',
    clientNode: 'http://jitsi.org/jitsimeet', // The name of client node advertised in XEP-0115 'c' stanza
    //deprecated desktop sharing settings, included only because older version of jitsi-meet require them
    desktopSharing: 'ext', // Desktop sharing method. Can be set to 'ext', 'webrtc' or false to disable.
    chromeExtensionId: 'pgplkhlodppdcflanmijbnpgpjkegfgc', // Id of desktop streamer Chrome extension
    desktopSharingSources: ['screen', 'window'],
    //new desktop sharing settings
    desktopSharingChromeExtId: 'pgplkhlodppdcflanmijbnpgpjkegfgc', // Id of desktop streamer Chrome extension
    desktopSharingChromeDisabled: false,
    desktopSharingChromeSources: ['screen', 'window', 'tab'],
    desktopSharingChromeMinExtVersion: '0.1.3', // Required version of Chrome extension
    desktopSharingFirefoxExtId: "jidesha@alpha.jitsi.net",
    desktopSharingFirefoxDisabled: true,
    desktopSharingFirefoxMaxVersionExtRequired: '0',
    desktopSharingFirefoxExtensionURL: "",
    useRoomAsSharedDocumentName: false,
    enableLipSync: false, // Disables lip-sync everywhere.
    disableRtx: false, // Enables RTX everywhere
    enableRtpStats: false, // Enables RTP stats processing
    enableStatsID: true,
    openBridgeChannel: 'websocket', // One of true, 'datachannel', or 'websocket'
    //openBridgeChannel: 'datachannel', // One of true, 'datachannel', or 'websocket'
    channelLastN: -1, // The default value of the channel attribute last-n.
    minHDHeight: 540,
    startBitrate: "800",
    disableAudioLevels: false,
    useRtcpMux: true,
    useBundle: true,
    disableSuspendVideo: true,
//    stereo: true,
    forceJVB121Ratio:  -1,
    enableTalkWhileMuted: true,

    hiddenDomain: 'recorder.alpha.jitsi.net',
    transcribingEnabled: false,
    enableRecording: true,
    liveStreamingEnabled: true,
    fileRecordingsEnabled: false,
    fileRecordingsServiceEnabled: false,
    fileRecordingsServiceSharingEnabled: false,
    requireDisplayName: false,
    recordingType: 'jibri',
    enableWelcomePage: true,
    isBrand: false,
    logStats: false,

    dropbox: {
        appKey: '3v5iyto7n7az02w'
    },

// To enable sending statistics to callstats.io you should provide Applicaiton ID and Secret.
    callStatsID: "294674397",//Application ID for callstats.io API
    callStatsSecret: "9IJJTtOdheZs:MHov7tz0Gc3h/6NYXiNVCqA1tpTmKPH0AdXTYtAKVRY=",//Secret for callstats.io API
    dialInNumbersUrl: 'https://api.jitsi.net/phoneNumberList',
    dialInConfCodeUrl:  'https://api.jitsi.net/conferenceMapper',

    dialOutCodesUrl:  'https://api.jitsi.net/countrycodes',
    dialOutAuthUrl: 'https://api.jitsi.net/authorizephone',
    peopleSearchUrl: 'https://api.jitsi.net/directorySearch',
    inviteServiceUrl: 'https://api.jitsi.net/conferenceInvite',
    inviteServiceCallFlowsUrl: 'https://api.jitsi.net/conferenceinvitecallflows',
    peopleSearchQueryTypes: ['user','conferenceRooms'],
    startAudioMuted: 9,
    startVideoMuted: 9,
    prejoinPageEnabled: true,
    enableUserRolesBasedOnToken: false,
    hepopAnalyticsUrl: "",
    hepopAnalyticsEvent: {
        product: "lib-jitsi-meet",
        subproduct: "alpha",
        name: "jitsi.page.load.failed",
        action: "page.load.failed",
        actionSubject: "page.load",
        type: "page.load.failed",
        source: "page.load",
        attributes: {
            type: "operational",
            source: 'page.load'
        },
        server: "alpha.jitsi.net"
    },
    deploymentInfo: {
        environment: 'alpha',
        envType: 'dev',
        releaseNumber: '',
        shard: 'all',
        region: 'us-west-2',
        userRegion: '',
        crossRegion: (!'' || 'us-west-2' === 'default_region') ? 0 : 1
    },
    rttMonitor: {
        enabled: false,
        initialDelay: 30000,
        getStatsInterval: 10000,
        analyticsInterval: 60000,
        stunServers: {"ap-se-1": "all-ap-se-1-turn.jitsi.net:443", "ap-se-2": "all-ap-se-2-turn.jitsi.net:443", "eu-central-1": "all-eu-central-1-turn.jitsi.net:443", "eu-west-1": "all-eu-west-1-turn.jitsi.net:443", "us-east-1": "all-us-east-1-turn.jitsi.net:443", "us-west-2": "all-us-west-2-turn.jitsi.net:443"}
    },
    abTesting: {
    },
    testing: {
        octo: {
            probability: 0
        }
    }
};