/* eslint-disable no-unused-vars, no-var */

var config = {
    // Configuration
    //

    // Alternative location for the configuration.
    // configLocation: './config.json',

    // Custom function which given the URL path should return a room name.
    // getroomnode: function (path) { return 'someprefixpossiblybasedonpath'; },


    // Connection
    //

    hosts: {
        // XMPP domain.
        domain: 'jitsi-meet.example.com',

        // XMPP MUC domain. FIXME: use XEP-0030 to discover it.
        muc: 'conference.jitsi-meet.example.com'

        // When using authentication, domain for guest users.
        // anonymousdomain: 'guest.example.com',

        // Domain for authenticated users. Defaults to <domain>.
        // authdomain: 'jitsi-meet.example.com',

        // Jirecon recording component domain.
        // jirecon: 'jirecon.jitsi-meet.example.com',

        // Call control component (Jigasi).
        // call_control: 'callcontrol.jitsi-meet.example.com',

        // Focus component domain. Defaults to focus.<domain>.
        // focus: 'focus.jitsi-meet.example.com',
    },

    // BOSH URL. FIXME: use XEP-0156 to discover it.
    bosh: '//jitsi-meet.example.com/http-bind',

    // The name of client node advertised in XEP-0115 'c' stanza
    clientNode: 'http://jitsi.org/jitsimeet',

    // The real JID of focus participant - can be overridden here
    // focusUserJid: 'focus@auth.jitsi-meet.example.com',


    // Testing / experimental features.
    //

    testing: {
        // Enables experimental simulcast support on Firefox.
        enableFirefoxSimulcast: false,

        // P2P test mode disables automatic switching to P2P when there are 2
        // participants in the conference.
        p2pTestMode: false
    },

    // Disables ICE/UDP by filtering out local and remote UDP candidates in
    // signalling.
    // webrtcIceUdpDisable: false,

    // Disables ICE/TCP by filtering out local and remote TCP candidates in
    // signalling.
    // webrtcIceTcpDisable: false,


    // Media
    //

    // Audio

    // Disable measuring of audio levels.
    // disableAudioLevels: false,

    // Start the conference in audio only mode (no video is being received nor
    // sent).
    // startAudioOnly: false,

    // Every participant after the Nth will start audio muted.
    // startAudioMuted: 10,

    // Start calls with audio muted. Unlike the option above, this one is only
    // applied locally. FIXME: having these 2 options is confusing.
    // startWithAudioMuted: false,

    // Video

    // Sets the preferred resolution (height) for local video. Defaults to 720.
    // resolution: 720,

    // Enable / disable simulcast support.
    // disableSimulcast: false,

    // Suspend sending video if bandwidth estimation is too low. This may cause
    // problems with audio playback. Disabled until these are fixed.
    disableSuspendVideo: true,

    // Every participant after the Nth will start video muted.
    // startVideoMuted: 10,

    // Start calls with video muted. Unlike the option above, this one is only
    // applied locally. FIXME: having these 2 options is confusing.
    // startWithVideoMuted: false,

    // If set to true, prefer to use the H.264 video codec (if supported).
    // Note that it's not recommended to do this because simulcast is not
    // supported when  using H.264. For 1-to-1 calls this setting is enabled by
    // default and can be toggled in the p2p section.
    // preferH264: true,

    // If set to true, disable H.264 video codec by stripping it out of the
    // SDP.
    // disableH264: false,

    // Desktop sharing

    // Enable / disable desktop sharing
    // disableDesktopSharing: false,

    // The ID of the jidesha extension for Chrome.
    desktopSharingChromeExtId: null,

    // Whether desktop sharing should be disabled on Chrome.
    desktopSharingChromeDisabled: true,

    // The media sources to use when using screen sharing with the Chrome
    // extension.
    desktopSharingChromeSources: [ 'screen', 'window', 'tab' ],

    // Required version of Chrome extension
    desktopSharingChromeMinExtVersion: '0.1',

    // The ID of the jidesha extension for Firefox. If null, we assume that no
    // extension is required.
    desktopSharingFirefoxExtId: null,

    // Whether desktop sharing should be disabled on Firefox.
    desktopSharingFirefoxDisabled: false,

    // The maximum version of Firefox which requires a jidesha extension.
    // Example: if set to 41, we will require the extension for Firefox versions
    // up to and including 41. On Firefox 42 and higher, we will run without the
    // extension.
    // If set to -1, an extension will be required for all versions of Firefox.
    desktopSharingFirefoxMaxVersionExtRequired: 51,

    // The URL to the Firefox extension for desktop sharing.
    desktopSharingFirefoxExtensionURL: null,

    // Try to start calls with screen-sharing instead of camera video.
    // startScreenSharing: false,

    // Recording

    // Whether to enable recording or not.
    // enableRecording: false,

    // Type for recording: one of jibri or jirecon.
    // recordingType: 'jibri',

    // Misc

    // Default value for the channel "last N" attribute. -1 for unlimited.
    channelLastN: -1,

    // Disables or enables RTX (RFC 4588) (defaults to false).
    // disableRtx: false,

    // Use XEP-0215 to fetch STUN and TURN servers.
    // useStunTurn: true,

    // Enable IPv6 support.
    // useIPv6: true,

    // Enables / disables a data communication channel with the Videobridge.
    // Values can be 'datachannel', 'websocket', true (treat it as
    // 'datachannel'), undefined (treat it as 'datachannel') and false (don't
    // open any channel).
    // openBridgeChannel: true,


    // UI
    //

    // Use display name as XMPP nickname.
    // useNicks: false,

    // Require users to always specify a display name.
    // requireDisplayName: true,

    // Whether to use a welcome page or not. In case it's false a random room
    // will be joined when no room is specified.
    enableWelcomePage: true,

    // Enabling the close page will ignore the welcome page redirection when
    // a call is hangup.
    // enableClosePage: false,

    // Disable hiding of remote thumbnails when in a 1-on-1 conference call.
    // disable1On1Mode: false,


    // The minumum value a video's height (or width, whichever is smaller) needs
    // The minimum value a video's height (or width, whichever is smaller) needs
    // to be in order to be considered high-definition.
    minHDHeight: 540,

    // Default language for the user interface.
    // defaultLanguage: 'en',

    // If true all users without a token will be considered guests and all users
    // with token will be considered non-guests. Only guests will be allowed to
    // edit their profile.
    enableUserRolesBasedOnToken: false,

    // Message to show the users. Example: 'The service will be down for
    // maintenance at 01:00 AM GMT,
    // noticeMessage: '',


    // Stats
    //

    // Whether to enable stats collection or not.
    // disableStats: false,

    // To enable sending statistics to callstats.io you must provide the
    // Application ID and Secret.
    // callStatsID: '',
    // callStatsSecret: '',

    // enables callstatsUsername to be reported as statsId and used
    // by callstats as repoted remote id
    // enableStatsID: false

    // enables sending participants display name to callstats
    // enableDisplayNameInStats: false


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
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
        ],

        // If set to true, it will prefer to use H.264 for P2P calls (if H.264
        // is supported).
        preferH264: true

        // If set to true, disable H.264 video codec by stripping it out of the
        // SDP.
        // disableH264: false,

        // How long we're going to wait, before going back to P2P after the 3rd
        // participant has left the conference (to filter out page reload).
        // backToP2PDelay: 5
    },


    // Information about the jitsi-meet instance we are connecting to, including
    // the user region as seen by the server.
    //

    deploymentInfo: {
        // shard: "shard1",
        // region: "europe",
        // userRegion: "asia"
    }
};

/* eslint-enable no-unused-vars, no-var */
