var config = {
    hosts: {
        domain: "meet.jit.si",

        muc: "conference.meet.jit.si", // FIXME: use XEP-0030
        focus: "focus.meet.jit.si",
    },

    // BOSH URL. FIXME: use XEP-0156 to discover it.
    bosh: '//jitsi-meet.example.com/http-bind',

    // Websocket URL
    // websocket: 'wss://jitsi-meet.example.com/xmpp-websocket',

    // The name of client node advertised in XEP-0115 'c' stanza
    clientNode: 'http://jitsi.org/jitsimeet',

    // The real JID of focus participant - can be overridden here
    // focusUserJid: 'focus@auth.jitsi-meet.example.com',


    // Testing / experimental features.
    //

    testing: {
        // Disables the End to End Encryption feature. Useful for debugging
        // issues related to insertable streams.
        // disableE2EE: false,

        // P2P test mode disables automatic switching to P2P when there are 2
        // participants in the conference.
        p2pTestMode: false

        // Enables the test specific features consumed by jitsi-meet-torture
        // testMode: false

        // Disables the auto-play behavior of *all* newly created video element.
        // This is useful when the client runs on a host with limited resources.
        // noAutoPlayVideo: false

        // Enable / disable 500 Kbps bitrate cap on desktop tracks. When enabled,
        // simulcast is turned off for the desktop share. If presenter is turned
        // on while screensharing is in progress, the max bitrate is automatically
        // adjusted to 2.5 Mbps. This takes a value between 0 and 1 which determines
        // the probability for this to be enabled.
        // capScreenshareBitrate: 1 // 0 to disable
    },
    enableInsecureRoomNameWarning: true,
    externalConnectUrl: "//meet.jit.si/http-pre-bind",
    analytics: {
        amplitudeAPPKey: "fafdba4c3b47fe5f151060ca37f02d2f",
        whiteListedEvents: [
            "conference.joined",
            "page.reload.scheduled",
            "rejoined",
            "transport.stats",
        ],
    },
    enableP2P: true, // flag to control P2P connections
    // New P2P options
    p2p: {
        enabled: true,
        preferH264: true,
        disableH264: true,
        useStunTurn: true, // use XEP-0215 to fetch STUN and TURN servers for the P2P connection
    },
    useStunTurn: true, // use XEP-0215 to fetch TURN servers for the JVB connection
    useTurnUdp: false,
    bosh: "//meet.jit.si/http-bind", // FIXME: use xep-0156 for that
    websocket: "wss://meet.jit.si/xmpp-websocket", // FIXME: use xep-0156 for that

    clientNode: "http://jitsi.org/jitsimeet", // The name of client node advertised in XEP-0115 'c' stanza
    //deprecated desktop sharing settings, included only because older version of jitsi-meet require them
    desktopSharing: "ext", // Desktop sharing method. Can be set to 'ext', 'webrtc' or false to disable.
    chromeExtensionId: "kglhbbefdnlheedjiejgomgmfplipfeb", // Id of desktop streamer Chrome extension
    desktopSharingSources: ["screen", "window"],
    googleApiApplicationClientID:
        "39065779381-bbhnkrgibtf4p0j9ne5vsq7bm49t1tlf.apps.googleusercontent.com",
    microsoftApiApplicationClientID: "00000000-0000-0000-0000-000040240063",
    enableCalendarIntegration: true,
    //new desktop sharing settings
    desktopSharingChromeExtId: "kglhbbefdnlheedjiejgomgmfplipfeb", // Id of desktop streamer Chrome extension
    desktopSharingChromeDisabled: false,
    desktopSharingChromeSources: ["screen", "window", "tab"],
    desktopSharingChromeMinExtVersion: "0.2.6.2", // Required version of Chrome extension
    desktopSharingFirefoxDisabled: false,
    useRoomAsSharedDocumentName: false,
    enableLipSync: false,
    disableRtx: false, // Enables RTX everywhere
    enableScreenshotCapture: false,
    openBridgeChannel: "websocket", // One of true, 'datachannel', or 'websocket'
    channelLastN: -1, // The default value of the channel attribute last-n.
    startBitrate: "800",
    disableAudioLevels: false,
    disableSuspendVideo: true,
    stereo: false,
    forceJVB121Ratio: -1,
    enableTalkWhileMuted: true,

    enableNoAudioDetection: true,

    enableNoisyMicDetection: true,

    // Start the conference in audio only mode (no video is being received nor
    // sent).
    // startAudioOnly: false,

    // Every participant after the Nth will start audio muted.
    // startAudioMuted: 10,

    // Start calls with audio muted. Unlike the option above, this one is only
    // applied locally. FIXME: having these 2 options is confusing.
    // startWithAudioMuted: false,

    // Enabling it (with #params) will disable local audio output of remote
    // participants and to enable it back a reload is needed.
    // startSilent: false

    // Sets the preferred target bitrate for the Opus audio codec by setting its
    // 'maxaveragebitrate' parameter. Currently not available in p2p mode.
    // Valid values are in the range 6000 to 510000
    // opusMaxAvgBitrate: 20000,

    // Video

    disableLocalVideoFlip: true,

    hiddenDomain: "recorder.meet.jit.si",
    dropbox: {
        appKey: "3v5iyto7n7az02w",
    },
    transcribingEnabled: false,
    enableRecording: true,
    liveStreamingEnabled: true,
    fileRecordingsEnabled: true,
    fileRecordingsServiceEnabled: false,
    fileRecordingsServiceSharingEnabled: false,
    requireDisplayName: false,
    enableWelcomePage: true,
    isBrand: false,
    dialInNumbersUrl: "https://api.jitsi.net/phoneNumberList",
    dialInConfCodeUrl: "https://api.jitsi.net/conferenceMapper",

    dialOutCodesUrl: "https://api.jitsi.net/countrycodes",
    dialOutAuthUrl: "https://api.jitsi.net/authorizephone",
    peopleSearchUrl: "https://api.jitsi.net/directorySearch",
    inviteServiceUrl: "https://api.jitsi.net/conferenceInvite",
    inviteServiceCallFlowsUrl:
        "https://api.jitsi.net/conferenceinvitecallflows",
    peopleSearchQueryTypes: ["user", "conferenceRooms"],
    startAudioMuted: 9,
    startVideoMuted: 9,
    enableUserRolesBasedOnToken: false,
  
    // Whether or not some features are checked based on token.
    // enableFeaturesBasedOnToken: false,

    // Enable lock room for all moderators, even when userRolesBasedOnToken is enabled and participants are guests.
    // lockRoomGuestEnabled: false,

    // When enabled the password used for locking a room is restricted to up to the number of digits specified
    // roomPasswordNumberOfDigits: 10,
    // default: roomPasswordNumberOfDigits: false,

    // Message to show the users. Example: 'The service will be down for
    // maintenance at 01:00 AM GMT,
    // noticeMessage: '',

    // Enables calendar integration, depends on googleApiApplicationClientID
    // and microsoftApiApplicationClientID
    // enableCalendarIntegration: false,

    // When 'true', it shows an intermediate page before joining, where the user can configure their devices.
    // prejoinPageEnabled: false,

    // If true, shows the unsafe room name warning label when a room name is
    // deemed unsafe (due to the simplicity in the name) and a password is not
    // set or the lobby is not enabled.
    // enableInsecureRoomNameWarning: false,

    // Stats
    //

    // Whether to enable stats collection or not in the TraceablePeerConnection.
    // This can be useful for debugging purposes (post-processing/analysis of
    // the webrtc stats) as it is done in the jitsi-meet-torture bandwidth
    // estimation tests.
    // gatherStats: false,

    // The interval at which PeerConnection.getStats() is called. Defaults to 10000
    // pcStatsInterval: 10000,

    // To enable sending statistics to callstats.io you must provide the
    // Application ID and Secret.
    // callStatsID: '',
    // callStatsSecret: '',

    // Enables sending participants' display names to callstats
    // enableDisplayNameInStats: false,

    // Enables sending participants' emails (if available) to callstats and other analytics
    // enableEmailInStats: false,

    // Privacy
    //

    // If third party requests are disabled, no other server will be contacted.
    // This means avatars will be locally generated and callstats integration
    // will not function.
    // disableThirdPartyRequests: false,


    // Peer-To-Peer mode: used (if enabled) when there are just 2 participants.
    //

    p2p: {
        // Enables peer to peer mode. When enabled the system will try to
        // establish a direct connection when there are exactly 2 participants
        // in the room. If that succeeds the conference will stop sending data
        // through the JVB and use the peer to peer connection instead. When a
        // 3rd participant joins the conference will be moved back to the JVB
        // connection.
        enabled: true,

        // Use XEP-0215 to fetch STUN and TURN servers.
        // useStunTurn: true,

        // The STUN servers that will be used in the peer to peer connections
        stunServers: [

            // { urls: 'stun:jitsi-meet.example.com:3478' },
            { urls: 'stun:meet-jit-si-turnrelay.jitsi.net:443' }
        ]

        // Sets the ICE transport policy for the p2p connection. At the time
        // of this writing the list of possible values are 'all' and 'relay',
        // but that is subject to change in the future. The enum is defined in
        // the WebRTC standard:
        // https://www.w3.org/TR/webrtc/#rtcicetransportpolicy-enum.
        // If not set, the effective value is 'all'.
        // iceTransportPolicy: 'all',

        // If set to true, it will prefer to use H.264 for P2P calls (if H.264
        // is supported).
        // preferH264: true

        // If set to true, disable H.264 video codec by stripping it out of the
        // SDP.
        // disableH264: false,

        // How long we're going to wait, before going back to P2P after the 3rd
        // participant has left the conference (to filter out page reload).
        // backToP2PDelay: 5
    },
    chromeExtensionBanner: {
        url:
            "https://chrome.google.com/webstore/detail/jitsi-meetings/kglhbbefdnlheedjiejgomgmfplipfeb",
        chromeExtensionsInfo: [
            {
                path: "jitsi-logo-48x48.png",
                id: "kglhbbefdnlheedjiejgomgmfplipfeb",
            },
        ],
    },
    prejoinPageEnabled: false,
    enableInsecureRoomNameWarning: true,
    hepopAnalyticsUrl: "",
    hepopAnalyticsEvent: {
        product: "lib-jitsi-meet",
        subproduct: "meet-jit-si",
        name: "jitsi.page.load.failed",
        action: "page.load.failed",
        actionSubject: "page.load",
        type: "page.load.failed",
        source: "page.load",
        attributes: {
            type: "operational",
            source: "page.load",
        },
        server: "meet.jit.si",
    },
    deploymentInfo: {
        environment: "meet-jit-si",
        envType: "prod",
        releaseNumber: "735",
        shard: "meet-jit-si-us-east-1a-s10",
        region: "us-east-1",
        userRegion: "us-east-1",
        crossRegion: !"us-east-1" || "us-east-1" === "us-east-1" ? 0 : 1,
    },
    rttMonitor: {
        enabled: false,
        initialDelay: 30000,
        getStatsInterval: 10000,
        analyticsInterval: 60000,
        stunServers: {
            "us-east-1": "all-us-east-1-turn.jitsi.net:443",
            "ap-se-2": "all-ap-se-2-turn.jitsi.net:443",
            "ap-se-1": "all-ap-se-1-turn.jitsi.net:443",
            "us-west-2": "all-us-west-2-turn.jitsi.net:443",
            "eu-central-1": "all-eu-central-1-turn.jitsi.net:443",
            "eu-west-1": "all-eu-west-1-turn.jitsi.net:443",
        },
    },
    e2eping: {
        pingInterval: -1,
    },
    abTesting: {},
    testing: {
        capScreenshareBitrate: 1,
        octo: {
            probability: 1,
        },
    },
};
