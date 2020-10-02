/* eslint-disable no-unused-vars, no-var */

var config = {
    // Connection
    //

    hosts: {
        // XMPP domain.
        domain: 'jitsi-meet.example.com',

        // When using authentication, domain for guest users.
        // anonymousdomain: 'guest.example.com',

        // Domain for authenticated users. Defaults to <domain>.
        // authdomain: 'jitsi-meet.example.com',

        // Call control component (Jigasi).
        // call_control: 'callcontrol.jitsi-meet.example.com',

        // Focus component domain. Defaults to focus.<domain>.
        // focus: 'focus.jitsi-meet.example.com',

        // XMPP MUC domain. FIXME: use XEP-0030 to discover it.
        muc: 'conference.jitsi-meet.example.com'
    },

    // BOSH URL. FIXME: use XEP-0156 to discover it.
    bosh: '//jitsi-meet.example.com/http-bind',

    // Websocket URL
    // websocket: 'wss://jitsi-meet.example.com/xmpp-websocket',

    // The name of client node advertised in XEP-0115 'c' stanza
    clientNode: 'http://jitsi.org/jitsimeet',

    // The real JID of focus participant - can be overridden here
    // Do not change username - FIXME: Make focus username configurable
    // https://github.com/jitsi/jitsi-meet/issues/7376
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

        // Enable callstats only for a percentage of users.
        // This takes a value between 0 and 100 which determines the probability for
        // the callstats to be enabled.
        // callStatsThreshold: 5 // enable callstats for 5% of the users.
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
    // audioLevelsInterval: 200,

    // Enabling this will run the lib-jitsi-meet no audio detection module which
    // will notify the user if the current selected microphone has no audio
    // input and will suggest another valid device if one is present.
    enableNoAudioDetection: true,

    // Enabling this will run the lib-jitsi-meet noise detection module which will
    // notify the user if there is noise, other than voice, coming from the current
    // selected microphone. The purpose it to let the user know that the input could
    // be potentially unpleasant for other meeting participants.
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
    // opusMaxAverageBitrate: 20000,

    // Enables redundancy for Opus
    // enableOpusRed: false

    // Video

    // Sets the preferred resolution (height) for local video. Defaults to 720.
    // resolution: 720,

    // How many participants while in the tile view mode, before the receiving video quality is reduced from HD to SD.
    // Use -1 to disable.
    // maxFullResolutionParticipants: 2,

    // w3c spec-compliant video constraints to use for video capture. Currently
    // used by browsers that return true from lib-jitsi-meet's
    // util#browser#usesNewGumFlow. The constraints are independent from
    // this config's resolution value. Defaults to requesting an ideal
    // resolution of 720p.
    // constraints: {
    //     video: {
    //         height: {
    //             ideal: 720,
    //             max: 720,
    //             min: 240
    //         }
    //     }
    // },

    // Enable / disable simulcast support.
    // disableSimulcast: false,

    // Enable / disable layer suspension.  If enabled, endpoints whose HD
    // layers are not in use will be suspended (no longer sent) until they
    // are requested again.
    // enableLayerSuspension: false,

    // Every participant after the Nth will start video muted.
    // startVideoMuted: 10,

    // Start calls with video muted. Unlike the option above, this one is only
    // applied locally. FIXME: having these 2 options is confusing.
    // startWithVideoMuted: false,

    // If set to true, prefer to use the H.264 video codec (if supported).
    // Note that it's not recommended to do this because simulcast is not
    // supported when  using H.264. For 1-to-1 calls this setting is enabled by
    // default and can be toggled in the p2p section.
    // This option has been deprecated, use preferredCodec under videoQuality section instead.
    // preferH264: true,

    // If set to true, disable H.264 video codec by stripping it out of the
    // SDP.
    // disableH264: false,

    // Desktop sharing

    // Optional desktop sharing frame rate options. Default value: min:5, max:5.
    // desktopSharingFrameRate: {
    //     min: 5,
    //     max: 5
    // },

    // Try to start calls with screen-sharing instead of camera video.
    // startScreenSharing: false,

    // Recording

    // Whether to enable file recording or not.
    // fileRecordingsEnabled: false,
    // Enable the dropbox integration.
    // dropbox: {
    //     appKey: '<APP_KEY>' // Specify your app key here.
    //     // A URL to redirect the user to, after authenticating
    //     // by default uses:
    //     // 'https://jitsi-meet.example.com/static/oauth.html'
    //     redirectURI:
    //          'https://jitsi-meet.example.com/subfolder/static/oauth.html'
    // },
    // When integrations like dropbox are enabled only that will be shown,
    // by enabling fileRecordingsServiceEnabled, we show both the integrations
    // and the generic recording service (its configuration and storage type
    // depends on jibri configuration)
    // fileRecordingsServiceEnabled: false,
    // Whether to show the possibility to share file recording with other people
    // (e.g. meeting participants), based on the actual implementation
    // on the backend.
    // fileRecordingsServiceSharingEnabled: false,

    // Whether to enable live streaming or not.
    // liveStreamingEnabled: false,

    // Transcription (in interface_config,
    // subtitles and buttons can be configured)
    // transcribingEnabled: false,

    // Enables automatic turning on captions when recording is started
    // autoCaptionOnRecord: false,

    // Misc

    // Default value for the channel "last N" attribute. -1 for unlimited.
    channelLastN: -1,

    // Provides a way to use different "last N" values based on the number of participants in the conference.
    // The keys in an Object represent number of participants and the values are "last N" to be used when number of
    // participants gets to or above the number.
    //
    // For the given example mapping, "last N" will be set to 20 as long as there are at least 5, but less than
    // 29 participants in the call and it will be lowered to 15 when the 30th participant joins. The 'channelLastN'
    // will be used as default until the first threshold is reached.
    //
    // lastNLimits: {
    //     5: 20,
    //     30: 15,
    //     50: 10,
    //     70: 5,
    //     90: 2
    // },

    // Specify the settings for video quality optimizations on the client.
    // videoQuality: {
    //    // Provides a way to prevent a video codec from being negotiated on the JVB connection. The codec specified
    //    // here will be removed from the list of codecs present in the SDP answer generated by the client. If the
    //    // same codec is specified for both the disabled and preferred option, the disable settings will prevail.
    //    // Note that 'VP8' cannot be disabled since it's a mandatory codec, the setting will be ignored in this case.
    //    disabledCodec: 'H264',
    //
    //    // Provides a way to set a preferred video codec for the JVB connection. If 'H264' is specified here,
    //    // simulcast will be automatically disabled since JVB doesn't support H264 simulcast yet. This will only
    //    // rearrange the the preference order of the codecs in the SDP answer generated by the browser only if the
    //    // preferred codec specified here is present. Please ensure that the JVB offers the specified codec for this
    //    // to take effect.
    //    preferredCodec: 'VP8',
    //
    //    // Provides a way to configure the maximum bitrates that will be enforced on the simulcast streams for
    //    // video tracks. The keys in the object represent the type of the stream (LD, SD or HD) and the values
    //    // are the max.bitrates to be set on that particular type of stream. The actual send may vary based on
    //    // the available bandwidth calculated by the browser, but it will be capped by the values specified here.
    //    // This is currently not implemented on app based clients on mobile.
    //    maxBitratesVideo: {
    //        low: 200000,
    //        standard: 500000,
    //        high: 1500000
    //    },
    //
    //    // The options can be used to override default thresholds of video thumbnail heights corresponding to
    //    // the video quality levels used in the application. At the time of this writing the allowed levels are:
    //    //     'low' - for the low quality level (180p at the time of this writing)
    //    //     'standard' - for the medium quality level (360p)
    //    //     'high' - for the high quality level (720p)
    //    // The keys should be positive numbers which represent the minimal thumbnail height for the quality level.
    //    //
    //    // With the default config value below the application will use 'low' quality until the thumbnails are
    //    // at least 360 pixels tall. If the thumbnail height reaches 720 pixels then the application will switch to
    //    // the high quality.
    //    minHeightForQualityLvl: {
    //        360: 'standard,
    //        720: 'high'
    //    }
    // },

    // // Options for the recording limit notification.
    // recordingLimit: {
    //
    //    // The recording limit in minutes. Note: This number appears in the notification text
    //    // but doesn't enforce the actual recording time limit. This should be configured in
    //    // jibri!
    //    limit: 60,
    //
    //    // The name of the app with unlimited recordings.
    //    appName: 'Unlimited recordings APP',
    //
    //    // The URL of the app with unlimited recordings.
    //    appURL: 'https://unlimited.recordings.app.com/'
    // },

    // Disables or enables RTX (RFC 4588) (defaults to false).
    // disableRtx: false,

    // Disables or enables TCC (the default is in Jicofo and set to true)
    // (draft-holmer-rmcat-transport-wide-cc-extensions-01). This setting
    // affects congestion control, it practically enables send-side bandwidth
    // estimations.
    // enableTcc: true,

    // Disables or enables REMB (the default is in Jicofo and set to false)
    // (draft-alvestrand-rmcat-remb-03). This setting affects congestion
    // control, it practically enables recv-side bandwidth estimations. When
    // both TCC and REMB are enabled, TCC takes precedence. When both are
    // disabled, then bandwidth estimations are disabled.
    // enableRemb: false,

    // Enables ICE restart logic in LJM and displays the page reload overlay on
    // ICE failure. Current disabled by default because it's causing issues with
    // signaling when Octo is enabled. Also when we do an "ICE restart"(which is
    // not a real ICE restart), the client maintains the TCC sequence number
    // counter, but the bridge resets it. The bridge sends media packets with
    // TCC sequence numbers starting from 0.
    // enableIceRestart: false,

    // Defines the minimum number of participants to start a call (the default
    // is set in Jicofo and set to 2).
    // minParticipants: 2,

    // Use TURN/UDP servers for the jitsi-videobridge connection (by default
    // we filter out TURN/UDP because it is usually not needed since the
    // bridge itself is reachable via UDP)
    // useTurnUdp: false

    // Enables / disables a data communication channel with the Videobridge.
    // Values can be 'datachannel', 'websocket', true (treat it as
    // 'datachannel'), undefined (treat it as 'datachannel') and false (don't
    // open any channel).
    // openBridgeChannel: true,
    openBridgeChannel: 'websocket',


    // UI
    //

    // Hides lobby button
    // hideLobbyButton: false,

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

    // Default language for the user interface.
    // defaultLanguage: 'en',

    // If true all users without a token will be considered guests and all users
    // with token will be considered non-guests. Only guests will be allowed to
    // edit their profile.
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

    // Whether to automatically copy invitation URL after creating a room.
    // Document should be focused for this option to work
    // enableAutomaticUrlCopy: false,

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
        // is supported). This setting is deprecated, use preferredCodec instead.
        // preferH264: true

        // Provides a way to set the video codec preference on the p2p connection. Acceptable
        // codec values are 'VP8', 'VP9' and 'H264'.
        // preferredCodec: 'H264',

        // If set to true, disable H.264 video codec by stripping it out of the
        // SDP. This setting is deprecated, use disabledCodec instead.
        // disableH264: false,

        // Provides a way to prevent a video codec from being negotiated on the p2p connection.
        // disabledCodec: '',

        // How long we're going to wait, before going back to P2P after the 3rd
        // participant has left the conference (to filter out page reload).
        // backToP2PDelay: 5
    },

    analytics: {
        // The Google Analytics Tracking ID:
        // googleAnalyticsTrackingId: 'your-tracking-id-UA-123456-1'

        // Matomo configuration:
        // matomoEndpoint: 'https://your-matomo-endpoint/',
        // matomoSiteID: '42',

        // The Amplitude APP Key:
        // amplitudeAPPKey: '<APP_KEY>'

        // Configuration for the rtcstats server:
        // By enabling rtcstats server every time a conference is joined the rtcstats
        // module connects to the provided rtcstatsEndpoint and sends statistics regarding
        // PeerConnection states along with getStats metrics polled at the specified
        // interval.
        // rtcstatsEnabled: true,

        // In order to enable rtcstats one needs to provide a endpoint url.
        // rtcstatsEndpoint: wss://rtcstats-server-pilot.jitsi.net/,

        // The interval at which rtcstats will poll getStats, defaults to 1000ms.
        // If the value is set to 0 getStats won't be polled and the rtcstats client
        // will only send data related to RTCPeerConnection events.
        // rtcstatsPolIInterval: 1000

        // Array of script URLs to load as lib-jitsi-meet "analytics handlers".
        // scriptURLs: [
        //      "libs/analytics-ga.min.js", // google-analytics
        //      "https://example.com/my-custom-analytics.js"
        // ],
    },

    // Logs that should go be passed through the 'log' event if a handler is defined for it
    // apiLogLevels: ['warn', 'log', 'error', 'info', 'debug'],

    // Information about the jitsi-meet instance we are connecting to, including
    // the user region as seen by the server.
    deploymentInfo: {
        // shard: "shard1",
        // region: "europe",
        // userRegion: "asia"
    },

    // Decides whether the start/stop recording audio notifications should play on record.
    // disableRecordAudioNotification: false,

    // Information for the chrome extension banner
    // chromeExtensionBanner: {
    //     // The chrome extension to be installed address
    //     url: 'https://chrome.google.com/webstore/detail/jitsi-meetings/kglhbbefdnlheedjiejgomgmfplipfeb',

    //     // Extensions info which allows checking if they are installed or not
    //     chromeExtensionsInfo: [
    //         {
    //             id: 'kglhbbefdnlheedjiejgomgmfplipfeb',
    //             path: 'jitsi-logo-48x48.png'
    //         }
    //     ]
    // },

    // Local Recording
    //

    // localRecording: {
    // Enables local recording.
    // Additionally, 'localrecording' (all lowercase) needs to be added to
    // TOOLBAR_BUTTONS in interface_config.js for the Local Recording
    // button to show up on the toolbar.
    //
    //     enabled: true,
    //

    // The recording format, can be one of 'ogg', 'flac' or 'wav'.
    //     format: 'flac'
    //

    // },

    // Options related to end-to-end (participant to participant) ping.
    // e2eping: {
    //   // The interval in milliseconds at which pings will be sent.
    //   // Defaults to 10000, set to <= 0 to disable.
    //   pingInterval: 10000,
    //
    //   // The interval in milliseconds at which analytics events
    //   // with the measured RTT will be sent. Defaults to 60000, set
    //   // to <= 0 to disable.
    //   analyticsInterval: 60000,
    //   },

    // If set, will attempt to use the provided video input device label when
    // triggering a screenshare, instead of proceeding through the normal flow
    // for obtaining a desktop stream.
    // NOTE: This option is experimental and is currently intended for internal
    // use only.
    // _desktopSharingSourceDevice: 'sample-id-or-label',

    // If true, any checks to handoff to another application will be prevented
    // and instead the app will continue to display in the current browser.
    // disableDeepLinking: false,

    // A property to disable the right click context menu for localVideo
    // the menu has option to flip the locally seen video for local presentations
    // disableLocalVideoFlip: false,

    // Mainly privacy related settings

    // Disables all invite functions from the app (share, invite, dial out...etc)
    // disableInviteFunctions: true,

    // Disables storing the room name to the recents list
    // doNotStoreRoom: true,

    // Deployment specific URLs.
    // deploymentUrls: {
    //    // If specified a 'Help' button will be displayed in the overflow menu with a link to the specified URL for
    //    // user documentation.
    //    userDocumentationURL: 'https://docs.example.com/video-meetings.html',
    //    // If specified a 'Download our apps' button will be displayed in the overflow menu with a link
    //    // to the specified URL for an app download page.
    //    downloadAppsUrl: 'https://docs.example.com/our-apps.html'
    // },

    // Options related to the remote participant menu.
    // remoteVideoMenu: {
    //     // If set to true the 'Kick out' button will be disabled.
    //     disableKick: true
    // },

    // If set to true all muting operations of remote participants will be disabled.
    // disableRemoteMute: true,

    /**
     External API url used to receive branding specific information.
     If there is no url set or there are missing fields, the defaults are applied.
     None of the fields are mandatory and the response must have the shape:
     {
         // The hex value for the colour used as background
         backgroundColor: '#fff',
         // The url for the image used as background
         backgroundImageUrl: 'https://example.com/background-img.png',
         // The anchor url used when clicking the logo image
         logoClickUrl: 'https://example-company.org',
         // The url used for the image used as logo
         logoImageUrl: 'https://example.com/logo-img.png'
     }
    */
    // brandingDataUrl: '',

    // The URL of the moderated rooms microservice, if available. If it
    // is present, a link to the service will be rendered on the welcome page,
    // otherwise the app doesn't render it.
    // moderatedRoomServiceUrl: 'https://moderated.jitsi-meet.example.com',

    // List of undocumented settings used in jitsi-meet
    /**
     _immediateReloadThreshold
     debug
     debugAudioLevels
     deploymentInfo
     dialInConfCodeUrl
     dialInNumbersUrl
     dialOutAuthUrl
     dialOutCodesUrl
     disableRemoteControl
     displayJids
     etherpad_base
     externalConnectUrl
     firefox_fake_device
     googleApiApplicationClientID
     iAmRecorder
     iAmSipGateway
     microsoftApiApplicationClientID
     peopleSearchQueryTypes
     peopleSearchUrl
     requireDisplayName
     tokenAuthUrl
     */

    /**
     * This property can be used to alter the generated meeting invite links (in combination with a branding domain
     * which is retrieved internally by jitsi meet) (e.g. https://meet.jit.si/someMeeting
     * can become https://brandedDomain/roomAlias)
     */
    // brandingRoomAlias: null,

    // List of undocumented settings used in lib-jitsi-meet
    /**
     _peerConnStatusOutOfLastNTimeout
     _peerConnStatusRtcMuteTimeout
     abTesting
     avgRtpStatsN
     callStatsConfIDNamespace
     callStatsCustomScriptUrl
     desktopSharingSources
     disableAEC
     disableAGC
     disableAP
     disableHPF
     disableNS
     enableLipSync
     enableTalkWhileMuted
     forceJVB121Ratio
     hiddenDomain
     ignoreStartMuted
     nick
     startBitrate
     */


    // Allow all above example options to include a trailing comma and
    // prevent fear when commenting out the last value.
    makeJsonParserHappy: 'even if last key had a trailing comma'

    // no configuration value should follow this line.
};

/* eslint-enable no-unused-vars, no-var */
