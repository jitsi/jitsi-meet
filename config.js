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

        // Focus component domain. Defaults to focus.<domain>.
        // focus: 'focus.jitsi-meet.example.com',

        // XMPP MUC domain. FIXME: use XEP-0030 to discover it.
        muc: 'conference.jitsi-meet.example.com'
    },

    // BOSH URL. FIXME: use XEP-0156 to discover it.
    bosh: '//jitsi-meet.example.com/http-bind',

    // Websocket URL
    // websocket: 'wss://jitsi-meet.example.com/xmpp-websocket',

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

        // Enables/disables thumbnail reordering in the filmstrip. It is enabled by default unless explicitly
        // disabled by the below option.
        // enableThumbnailReordering: true,

        // Enables XMPP WebSocket (as opposed to BOSH) for the given amount of users.
        // mobileXmppWsThreshold: 10 // enable XMPP WebSockets on mobile for 10% of the users

        // P2P test mode disables automatic switching to P2P when there are 2
        // participants in the conference.
        // p2pTestMode: false,

        // Enables the test specific features consumed by jitsi-meet-torture
        // testMode: false

        // Disables the auto-play behavior of *all* newly created video element.
        // This is useful when the client runs on a host with limited resources.
        // noAutoPlayVideo: false

        // Enable / disable 500 Kbps bitrate cap on desktop tracks. When enabled,
        // simulcast is turned off for the desktop share. If presenter is turned
        // on while screensharing is in progress, the max bitrate is automatically
        // adjusted to 2.5 Mbps. This takes a value between 0 and 1 which determines
        // the probability for this to be enabled. This setting has been deprecated.
        // desktopSharingFrameRate.max now determines whether simulcast will be enabled
        // or disabled for the screenshare.
        // capScreenshareBitrate: 1 // 0 to disable - deprecated.

        // Enable callstats only for a percentage of users.
        // This takes a value between 0 and 100 which determines the probability for
        // the callstats to be enabled.
        // callStatsThreshold: 5 // enable callstats for 5% of the users.
    },

    // Disables moderator indicators.
    // disableModeratorIndicator: false,

    // Disables the reactions feature.
    // disableReactions: true,

    // Disables polls feature.
    // disablePolls: false,

    // Disables ICE/UDP by filtering out local and remote UDP candidates in
    // signalling.
    // webrtcIceUdpDisable: false,

    // Disables ICE/TCP by filtering out local and remote TCP candidates in
    // signalling.
    // webrtcIceTcpDisable: false,


    // Media
    //

    // Enable unified plan implementation support on Chromium based browsers.
    // enableUnifiedOnChrome: false,

    // Audio

    // Disable measuring of audio levels.
    // disableAudioLevels: false,
    // audioLevelsInterval: 200,

    // Enabling this will run the lib-jitsi-meet no audio detection module which
    // will notify the user if the current selected microphone has no audio
    // input and will suggest another valid device if one is present.
    enableNoAudioDetection: true,

    // Enabling this will show a "Save Logs" link in the GSM popover that can be
    // used to collect debug information (XMPP IQs, SDP offer/answer cycles)
    // about the call.
    // enableSaveLogs: false,

    // Enabling this will hide the "Show More" link in the GSM popover that can be
    // used to display more statistics about the connection (IP, Port, protocol, etc).
    // disableShowMoreStats: true,

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

    // Enables support for opus-red (redundancy for Opus).
    // enableOpusRed: false,

    // Specify audio quality stereo and opusMaxAverageBitrate values in order to enable HD audio.
    // Beware, by doing so, you are disabling echo cancellation, noise suppression and AGC.
    // audioQuality: {
    //     stereo: false,
    //     opusMaxAverageBitrate: null // Value to fit the 6000 to 510000 range.
    // },

    // Video

    // Sets the preferred resolution (height) for local video. Defaults to 720.
    // resolution: 720,

    // Specifies whether the raised hand will hide when someone becomes a dominant speaker or not
    // disableRemoveRaisedHandOnFocus: false,

    // Specifies whether there will be a search field in speaker stats or not
    // disableSpeakerStatsSearch: false,

    // Specifies whether participants in speaker stats should be ordered or not, and with what priority
    // speakerStatsOrder: [
    //  'role', <- Moderators on top
    //  'name', <- Alphabetically by name
    //  'hasLeft', <- The ones that have left in the bottom
    // ] <- the order of the array elements determines priority

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

    // Enable / disable layer suspension.  If enabled, endpoints whose HD layers are not in use will be suspended
    // (no longer sent) until they are requested again. This is enabled by default. This must be enabled for screen
    // sharing to work as expected on Chrome. Disabling this might result in low resolution screenshare being sent
    // by the client.
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

    // If true transcriber will use the application language.
    // The application language is either explicitly set by participants in their settings or automatically
    // detected based on the environment, e.g. if the app is opened in a chrome instance which is using french as its
    // default language then transcriptions for that participant will be in french.
    // Defaults to true.
    // transcribeWithAppLanguage: true,

    // Transcriber language. This settings will only work if "transcribeWithAppLanguage" is explicitly set to false.
    // Available languages can be found in
    // ./src/react/features/transcribing/transcriber-langs.json.
    // preferredTranscribeLanguage: 'en-US',

    // Enables automatic turning on captions when recording is started
    // autoCaptionOnRecord: false,

    // Misc

    // Default value for the channel "last N" attribute. -1 for unlimited.
    channelLastN: -1,

    // Connection indicators
    // connectionIndicators: {
    //     autoHide: true,
    //     autoHideTimeout: 5000,
    //     disabled: false,
    //     disableDetails: false,
    //     inactiveDisabled: false
    // },

    // Provides a way for the lastN value to be controlled through the UI.
    // When startLastN is present, conference starts with a last-n value of startLastN and channelLastN
    // value will be used when the quality level is selected using "Manage Video Quality" slider.
    // startLastN: 1,

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

    // Provides a way to translate the legacy bridge signaling messages, 'LastNChangedEvent',
    // 'SelectedEndpointsChangedEvent' and 'ReceiverVideoConstraint' into the new 'ReceiverVideoConstraints' message
    // that invokes the new bandwidth allocation algorithm in the bridge which is described here
    // - https://github.com/jitsi/jitsi-videobridge/blob/master/doc/allocation.md.
    // useNewBandwidthAllocationStrategy: false,

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
    //    // Provides a way to enforce the preferred codec for the conference even when the conference has endpoints
    //    // that do not support the preferred codec. For example, older versions of Safari do not support VP9 yet.
    //    // This will result in Safari not being able to decode video from endpoints sending VP9 video.
    //    // When set to false, the conference falls back to VP8 whenever there is an endpoint that doesn't support the
    //    // preferred codec and goes back to the preferred codec when that endpoint leaves.
    //    // enforcePreferredCodec: false,
    //
    //    // Provides a way to configure the maximum bitrates that will be enforced on the simulcast streams for
    //    // video tracks. The keys in the object represent the type of the stream (LD, SD or HD) and the values
    //    // are the max.bitrates to be set on that particular type of stream. The actual send may vary based on
    //    // the available bandwidth calculated by the browser, but it will be capped by the values specified here.
    //    // This is currently not implemented on app based clients on mobile.
    //    maxBitratesVideo: {
    //          H264: {
    //              low: 200000,
    //              standard: 500000,
    //              high: 1500000
    //          },
    //          VP8 : {
    //              low: 200000,
    //              standard: 500000,
    //              high: 1500000
    //          },
    //          VP9: {
    //              low: 100000,
    //              standard: 300000,
    //              high: 1200000
    //          }
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
    //        360: 'standard',
    //        720: 'high'
    //    },
    //
    //    // Provides a way to resize the desktop track to 720p (if it is greater than 720p) before creating a canvas
    //    // for the presenter mode (camera picture-in-picture mode with screenshare).
    //    resizeDesktopForPresenter: false
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

    // Disables or enables TCC support in this client (default: enabled).
    // enableTcc: true,

    // Disables or enables REMB support in this client (default: enabled).
    // enableRemb: true,

    // Enables ICE restart logic in LJM and displays the page reload overlay on
    // ICE failure. Current disabled by default because it's causing issues with
    // signaling when Octo is enabled. Also when we do an "ICE restart"(which is
    // not a real ICE restart), the client maintains the TCC sequence number
    // counter, but the bridge resets it. The bridge sends media packets with
    // TCC sequence numbers starting from 0.
    // enableIceRestart: false,

    // Enables forced reload of the client when the call is migrated as a result of
    // the bridge going down.
    // enableForcedReload: true,

    // Use TURN/UDP servers for the jitsi-videobridge connection (by default
    // we filter out TURN/UDP because it is usually not needed since the
    // bridge itself is reachable via UDP)
    // useTurnUdp: false

    // Enable support for encoded transform in supported browsers. This allows
    // E2EE to work in Safari if the corresponding flag is enabled in the browser.
    // Experimental.
    // enableEncodedTransformSupport: false,

    // UI
    //

    // Disables responsive tiles.
    // disableResponsiveTiles: false,

    // Hides lobby button
    // hideLobbyButton: false,

    // Require users to always specify a display name.
    // requireDisplayName: true,

    // Whether to use a welcome page or not. In case it's false a random room
    // will be joined when no room is specified.
    enableWelcomePage: true,

    // Disable app shortcuts that are registered upon joining a conference
    // disableShortcuts: false,

    // Disable initial browser getUserMedia requests.
    // This is useful for scenarios where users might want to start a conference for screensharing only
    // disableInitialGUM: false,

    // Enabling the close page will ignore the welcome page redirection when
    // a call is hangup.
    // enableClosePage: false,

    // Disable hiding of remote thumbnails when in a 1-on-1 conference call.
    // Setting this to null, will also disable showing the remote videos
    // when the toolbar is shown on mouse movements
    // disable1On1Mode: null | false | true,

    // Default language for the user interface.
    // defaultLanguage: 'en',

    // Disables profile and the edit of all fields from the profile settings (display name and email)
    // disableProfile: false,

    // Whether or not some features are checked based on token.
    // enableFeaturesBasedOnToken: false,

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

    // When 'true', the user cannot edit the display name.
    // (Mainly useful when used in conjuction with the JWT so the JWT name becomes read only.)
    // readOnlyName: false,

    // If etherpad integration is enabled, setting this to true will
    // automatically open the etherpad when a participant joins.  This
    // does not affect the mobile app since opening an etherpad
    // obscures the conference controls -- it's better to let users
    // choose to open the pad on their own in that case.
    // openSharedDocumentOnJoin: false,

    // If true, shows the unsafe room name warning label when a room name is
    // deemed unsafe (due to the simplicity in the name) and a password is not
    // set or the lobby is not enabled.
    // enableInsecureRoomNameWarning: false,

    // Whether to automatically copy invitation URL after creating a room.
    // Document should be focused for this option to work
    // enableAutomaticUrlCopy: false,

    // Base URL for a Gravatar-compatible service. Defaults to libravatar.
    // gravatarBaseURL: 'https://seccdn.libravatar.org/avatar/',

    // App name to be displayed in the invitation email subject, as an alternative to
    // interfaceConfig.APP_NAME.
    // inviteAppName: null,

    // Moved from interfaceConfig(TOOLBAR_BUTTONS).
    // The name of the toolbar buttons to display in the toolbar, including the
    // "More actions" menu. If present, the button will display. Exceptions are
    // "livestreaming" and "recording" which also require being a moderator and
    // some other values in config.js to be enabled. Also, the "profile" button will
    // not display for users with a JWT.
    // Notes:
    // - it's impossible to choose which buttons go in the "More actions" menu
    // - it's impossible to control the placement of buttons
    // - 'desktop' controls the "Share your screen" button
    // - if `toolbarButtons` is undefined, we fallback to enabling all buttons on the UI
    // toolbarButtons: [
    //    'camera',
    //    'chat',
    //    'closedcaptions',
    //    'desktop',
    //    'download',
    //    'embedmeeting',
    //    'etherpad',
    //    'feedback',
    //    'filmstrip',
    //    'fullscreen',
    //    'hangup',
    //    'help',
    //    'invite',
    //    'livestreaming',
    //    'microphone',
    //    'mute-everyone',
    //    'mute-video-everyone',
    //    'participants-pane',
    //    'profile',
    //    'raisehand',
    //    'recording',
    //    'security',
    //    'select-background',
    //    'settings',
    //    'shareaudio',
    //    'sharedvideo',
    //    'shortcuts',
    //    'stats',
    //    'tileview',
    //    'toggle-camera',
    //    'videoquality',
    //    '__end'
    // ],

    // Holds values related to toolbar visibility control.
    // toolbarConfig: {
    //     // Moved from interfaceConfig.INITIAL_TOOLBAR_TIMEOUT
    //     // The initial numer of miliseconds for the toolbar buttons to be visible on screen.
    //     initialTimeout: 20000,
    //     // Moved from interfaceConfig.TOOLBAR_TIMEOUT
    //     // Number of miliseconds for the toolbar buttons to be visible on screen.
    //     timeout: 4000,
    //     // Moved from interfaceConfig.TOOLBAR_ALWAYS_VISIBLE
    //     // Whether toolbar should be always visible or should hide after x miliseconds.
    //     alwaysVisible: false
    // },

    // Toolbar buttons which have their click event exposed through the API on
    // `toolbarButtonClicked` event instead of executing the normal click routine.
    // buttonsWithNotifyClick: [
    //    'camera',
    //    'chat',
    //    'closedcaptions',
    //    'desktop',
    //    'download',
    //    'embedmeeting',
    //    'etherpad',
    //    'feedback',
    //    'filmstrip',
    //    'fullscreen',
    //    'hangup',
    //    'help',
    //    'invite',
    //    'livestreaming',
    //    'microphone',
    //    'mute-everyone',
    //    'mute-video-everyone',
    //    'participants-pane',
    //    'profile',
    //    'raisehand',
    //    'recording',
    //    'security',
    //    'select-background',
    //    'settings',
    //    'shareaudio',
    //    'sharedvideo',
    //    'shortcuts',
    //    'stats',
    //    'tileview',
    //    'toggle-camera',
    //    'videoquality',
    //    '__end'
    // ],

    // List of pre meeting screens buttons to hide. The values must be one or more of the 5 allowed buttons:
    // 'microphone', 'camera', 'select-background', 'invite', 'settings'
    // hiddenPremeetingButtons: [],

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

    // The callstats initialize config params as described in the API:
    // https://docs.callstats.io/docs/javascript#callstatsinitialize-with-app-secret
    // callStatsConfigParams: {
    //     disableBeforeUnloadHandler: true, // disables callstats.js's window.onbeforeunload parameter.
    //     applicationVersion: "app_version", // Application version specified by the developer.
    //     disablePrecalltest: true, // disables the pre-call test, it is enabled by default.
    //     siteID: "siteID", // The name/ID of the site/campus from where the call/pre-call test is made.
    //     additionalIDs: { // additionalIDs object, contains application related IDs.
    //         customerID: "Customer Identifier. Example, walmart.",
    //         tenantID: "Tenant Identifier. Example, monster.",
    //         productName: "Product Name. Example, Jitsi.",
    //         meetingsName: "Meeting Name. Example, Jitsi loves callstats.",
    //         serverName: "Server/MiddleBox Name. Example, jvb-prod-us-east-mlkncws12.",
    //         pbxID: "PBX Identifier. Example, walmart.",
    //         pbxExtensionID: "PBX Extension Identifier. Example, 5625.",
    //         fqExtensionID: "Fully qualified Extension Identifier. Example, +71 (US) +5625.",
    //         sessionID: "Session Identifier. Example, session-12-34"
    //     },
    //     collectLegacyStats: true, //enables the collection of legacy stats in chrome browser
    //     collectIP: true //enables the collection localIP address
    // },

    // Enables sending participants' display names to callstats
    // enableDisplayNameInStats: false,

    // Enables sending participants' emails (if available) to callstats and other analytics
    // enableEmailInStats: false,

    // Controls the percentage of automatic feedback shown to participants when callstats is enabled.
    // The default value is 100%. If set to 0, no automatic feedback will be requested
    // feedbackPercentage: 100,

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

        // Enable unified plan implementation support on Chromium for p2p connection.
        // enableUnifiedOnChrome: false,

        // Sets the ICE transport policy for the p2p connection. At the time
        // of this writing the list of possible values are 'all' and 'relay',
        // but that is subject to change in the future. The enum is defined in
        // the WebRTC standard:
        // https://www.w3.org/TR/webrtc/#rtcicetransportpolicy-enum.
        // If not set, the effective value is 'all'.
        // iceTransportPolicy: 'all',

        // If set to true, it will prefer to use H.264 for P2P calls (if H.264
        // is supported). This setting is deprecated, use preferredCodec instead.
        // preferH264: true,

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
        // backToP2PDelay: 5,

        // The STUN servers that will be used in the peer to peer connections
        stunServers: [

            // { urls: 'stun:jitsi-meet.example.com:3478' },
            { urls: 'stun:meet-jit-si-turnrelay.jitsi.net:443' }
        ]
    },

    analytics: {
        // True if the analytics should be disabled
        // disabled: false,

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
        // rtcstatsPolIInterval: 1000,

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

    // Array<string> of disabled sounds.
    // Possible values:
    // - 'ASKED_TO_UNMUTE_SOUND'
    // - 'E2EE_OFF_SOUND'
    // - 'E2EE_ON_SOUND'
    // - 'INCOMING_MSG_SOUND'
    // - 'KNOCKING_PARTICIPANT_SOUND'
    // - 'LIVE_STREAMING_OFF_SOUND'
    // - 'LIVE_STREAMING_ON_SOUND'
    // - 'NO_AUDIO_SIGNAL_SOUND'
    // - 'NOISY_AUDIO_INPUT_SOUND'
    // - 'OUTGOING_CALL_EXPIRED_SOUND'
    // - 'OUTGOING_CALL_REJECTED_SOUND'
    // - 'OUTGOING_CALL_RINGING_SOUND'
    // - 'OUTGOING_CALL_START_SOUND'
    // - 'PARTICIPANT_JOINED_SOUND'
    // - 'PARTICIPANT_LEFT_SOUND'
    // - 'RAISE_HAND_SOUND'
    // - 'REACTION_SOUND'
    // - 'RECORDING_OFF_SOUND'
    // - 'RECORDING_ON_SOUND'
    // - 'TALK_WHILE_MUTED_SOUND'
    // disabledSounds: [],

    // DEPRECATED! Use `disabledSounds` instead.
    // Decides whether the start/stop recording audio notifications should play on record.
    // disableRecordAudioNotification: false,

    // DEPRECATED! Use `disabledSounds` instead.
    // Disables the sounds that play when other participants join or leave the
    // conference (if set to true, these sounds will not be played).
    // disableJoinLeaveSounds: false,

    // DEPRECATED! Use `disabledSounds` instead.
    // Disables the sounds that play when a chat message is received.
    // disableIncomingMessageSound: false,

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
    // the `toolbarButtons`-array for the Local Recording button to show up
    // on the toolbar.
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

    // A property used to unset the default flip state of the local video.
    // When it is set to 'true', the local(self) video will not be mirrored anymore.
    // doNotFlipLocalVideo: false,

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
    //     disableKick: true,
    //     // If set to true the 'Grant moderator' button will be disabled.
    //     disableGrantModerator: true
    // },

    // If set to true all muting operations of remote participants will be disabled.
    // disableRemoteMute: true,

    // Enables support for lip-sync for this client (if the browser supports it).
    // enableLipSync: false

    /**
     External API url used to receive branding specific information.
     If there is no url set or there are missing fields, the defaults are applied.
     The config file should be in JSON.
     None of the fields are mandatory and the response must have the shape:
     {
         // The domain url to apply (will replace the domain in the sharing conference link/embed section)
         inviteDomain: 'example-company.org,
         // The hex value for the colour used as background
         backgroundColor: '#fff',
         // The url for the image used as background
         backgroundImageUrl: 'https://example.com/background-img.png',
         // The anchor url used when clicking the logo image
         logoClickUrl: 'https://example-company.org',
         // The url used for the image used as logo
         logoImageUrl: 'https://example.com/logo-img.png',
         // Overwrite for pool of background images for avatars
         avatarBackgrounds: ['url(https://example.com/avatar-background-1.png)', '#FFF'],
         // The lobby/prejoin screen background
         premeetingBackground: 'url(https://example.com/premeeting-background.png)',
         // A list of images that can be used as video backgrounds.
         // When this field is present, the default images will be replaced with those provided.
         virtualBackgrounds: ['https://example.com/img.jpg']
     }
    */
    // dynamicBrandingUrl: '',

    // When true the user cannot add more images to be used as virtual background.
    // Only the default ones from will be available.
    // disableAddingBackgroundImages: false,

    // Disables using screensharing as virtual background.
    // disableScreensharingVirtualBackground: false,

    // Sets the background transparency level. '0' is fully transparent, '1' is opaque.
    // backgroundAlpha: 1,

    // The URL of the moderated rooms microservice, if available. If it
    // is present, a link to the service will be rendered on the welcome page,
    // otherwise the app doesn't render it.
    // moderatedRoomServiceUrl: 'https://moderated.jitsi-meet.example.com',

    // If true, tile view will not be enabled automatically when the participants count threshold is reached.
    // disableTileView: true,

    // Controls the visibility and behavior of the top header conference info labels.
    // If a label's id is not in any of the 2 arrays, it will not be visible at all on the header.
    // conferenceInfo: {
    //     // those labels will not be hidden in tandem with the toolbox.
    //     alwaysVisible: ['recording', 'local-recording'],
    //     // those labels will be auto-hidden in tandem with the toolbox buttons.
    //     autoHide: [
    //         'subject',
    //         'conference-timer',
    //         'participants-count',
    //         'e2ee',
    //         'transcribing',
    //         'video-quality',
    //         'insecure-room'
    //     ]
    // },

    // Hides the conference subject
    // hideConferenceSubject: true,

    // Hides the conference timer.
    // hideConferenceTimer: true,

    // Hides the recording label
    // hideRecordingLabel: false,

    // Hides the participants stats
    // hideParticipantsStats: true,

    // Sets the conference subject
    // subject: 'Conference Subject',

    // This property is related to the use case when jitsi-meet is used via the IFrame API. When the property is true
    // jitsi-meet will use the local storage of the host page instead of its own. This option is useful if the browser
    // is not persisting the local storage inside the iframe.
    // useHostPageLocalStorage: true,

    // etherpad ("shared document") integration.
    //

    // If set, add a "Open shared document" link to the bottom right menu that
    // will open an etherpad document.
    // etherpad_base: 'https://your-etherpad-installati.on/p/',

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
     externalConnectUrl
     e2eeLabels
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
     enableTalkWhileMuted
     forceJVB121Ratio
     forceTurnRelay
     hiddenDomain
     ignoreStartMuted
     websocketKeepAlive
     websocketKeepAliveUrl
     */

    /**
     * Default interval (milliseconds) for triggering mouseMoved iframe API event
     */
    mouseMoveCallbackInterval: 1000,

    /**
        Use this array to configure which notifications will be shown to the user
        The items correspond to the title or description key of that notification
        Some of these notifications also depend on some other internal logic to be displayed or not,
        so adding them here will not ensure they will always be displayed

        A falsy value for this prop will result in having all notifications enabled (e.g null, undefined, false)
    */
    // notifications: [
    //     'connection.CONNFAIL', // shown when the connection fails,
    //     'dialog.cameraNotSendingData', // shown when there's no feed from user's camera
    //     'dialog.kickTitle', // shown when user has been kicked
    //     'dialog.liveStreaming', // livestreaming notifications (pending, on, off, limits)
    //     'dialog.lockTitle', // shown when setting conference password fails
    //     'dialog.maxUsersLimitReached', // shown when maximmum users limit has been reached
    //     'dialog.micNotSendingData', // shown when user's mic is not sending any audio
    //     'dialog.passwordNotSupportedTitle', // shown when setting conference password fails due to password format
    //     'dialog.recording', // recording notifications (pending, on, off, limits)
    //     'dialog.remoteControlTitle', // remote control notifications (allowed, denied, start, stop, error)
    //     'dialog.reservationError',
    //     'dialog.serviceUnavailable', // shown when server is not reachable
    //     'dialog.sessTerminated', // shown when there is a failed conference session
    //     'dialog.sessionRestarted', // show when a client reload is initiated because of bridge migration
    //     'dialog.tokenAuthFailed', // show when an invalid jwt is used
    //     'dialog.transcribing', // transcribing notifications (pending, off)
    //     'dialOut.statusMessage', // shown when dial out status is updated.
    //     'liveStreaming.busy', // shown when livestreaming service is busy
    //     'liveStreaming.failedToStart', // shown when livestreaming fails to start
    //     'liveStreaming.unavailableTitle', // shown when livestreaming service is not reachable
    //     'lobby.joinRejectedMessage', // shown when while in a lobby, user's request to join is rejected
    //     'lobby.notificationTitle', // shown when lobby is toggled and when join requests are allowed / denied
    //     'localRecording.localRecording', // shown when a local recording is started
    //     'notify.disconnected', // shown when a participant has left
    //     'notify.connectedOneMember', // show when a participant joined
    //     'notify.connectedTwoMembers', // show when two participants joined simultaneously
    //     'notify.connectedThreePlusMembers', // show when more than 2 participants joined simultaneously
    //     'notify.grantedTo', // shown when moderator rights were granted to a participant
    //     'notify.invitedOneMember', // shown when 1 participant has been invited
    //     'notify.invitedThreePlusMembers', // shown when 3+ participants have been invited
    //     'notify.invitedTwoMembers', // shown when 2 participants have been invited
    //     'notify.kickParticipant', // shown when a participant is kicked
    //     'notify.moderationStartedTitle', // shown when AV moderation is activated
    //     'notify.moderationStoppedTitle', // shown when AV moderation is deactivated
    //     'notify.moderationInEffectTitle', // shown when user attempts to unmute audio during AV moderation
    //     'notify.moderationInEffectVideoTitle', // shown when user attempts to enable video during AV moderation
    //     'notify.moderationInEffectCSTitle', // shown when user attempts to share content during AV moderation
    //     'notify.mutedRemotelyTitle', // shown when user is muted by a remote party
    //     'notify.mutedTitle', // shown when user has been muted upon joining,
    //     'notify.newDeviceAudioTitle', // prompts the user to use a newly detected audio device
    //     'notify.newDeviceCameraTitle', // prompts the user to use a newly detected camera
    //     'notify.passwordRemovedRemotely', // shown when a password has been removed remotely
    //     'notify.passwordSetRemotely', // shown when a password has been set remotely
    //     'notify.raisedHand', // shown when a partcipant used raise hand,
    //     'notify.startSilentTitle', // shown when user joined with no audio
    //     'notify.unmute', // shown to moderator when user raises hand during AV moderation
    //     'prejoin.errorDialOut',
    //     'prejoin.errorDialOutDisconnected',
    //     'prejoin.errorDialOutFailed',
    //     'prejoin.errorDialOutStatus',
    //     'prejoin.errorStatusCode',
    //     'prejoin.errorValidation',
    //     'recording.busy', // shown when recording service is busy
    //     'recording.failedToStart', // shown when recording fails to start
    //     'recording.unavailableTitle', // shown when recording service is not reachable
    //     'toolbar.noAudioSignalTitle', // shown when a broken mic is detected
    //     'toolbar.noisyAudioInputTitle', // shown when noise is detected for the current microphone
    //     'toolbar.talkWhileMutedPopup', // shown when user tries to speak while muted
    //     'transcribing.failedToStart' // shown when transcribing fails to start
    // ],

    // Prevent the filmstrip from autohiding when screen width is under a certain threshold
    // disableFilmstripAutohiding: false,

    // Specifies whether the chat emoticons are disabled or not
    // disableChatSmileys: false,

    // Allow all above example options to include a trailing comma and
    // prevent fear when commenting out the last value.
    makeJsonParserHappy: 'even if last key had a trailing comma'

    // no configuration value should follow this line.
};

/* eslint-enable no-unused-vars, no-var */
