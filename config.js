/* eslint-disable comma-dangle, no-unused-vars, no-var, prefer-template, vars-on-top */

/*
 * NOTE: If you add a new option please remember to document it here:
 * https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-configuration
 */

var subdir = '<!--# echo var="subdir" default="" -->';
var subdomain = '<!--# echo var="subdomain" default="" -->';

if (subdomain) {
    subdomain = subdomain.substr(0, subdomain.length - 1).split('.')
        .join('_')
        .toLowerCase() + '.';
}

// In case of no ssi provided by the webserver, use empty strings
if (subdir.startsWith('<!--')) {
    subdir = '';
}
if (subdomain.startsWith('<!--')) {
    subdomain = '';
}

var enableJaaS = false;

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
        muc: 'conference.' + subdomain + 'jitsi-meet.example.com',
    },

    // BOSH URL. FIXME: use XEP-0156 to discover it.
    bosh: 'https://jitsi-meet.example.com/' + subdir + 'http-bind',

    // Websocket URL (XMPP)
    // websocket: 'wss://jitsi-meet.example.com/' + subdir + 'xmpp-websocket',

    // Whether BOSH should be preferred over WebSocket if both are configured.
    // preferBosh: false,

    // The real JID of focus participant - can be overridden here
    // Do not change username - FIXME: Make focus username configurable
    // https://github.com/jitsi/jitsi-meet/issues/7376
    // focusUserJid: 'focus@auth.jitsi-meet.example.com',

    // Options related to the bridge (colibri) data channel
    bridgeChannel: {
        // If the backend advertises multiple colibri websockets, this options allows
        // to filter some of them out based on the domain name. We use the first URL
        // which does not match ignoreDomain, falling back to the first one that matches
        // ignoreDomain. Has no effect if undefined.
        // ignoreDomain: 'example.com',

        // Prefer SCTP (WebRTC data channels over the media path) over a colibri websocket.
        // If SCTP is available in the backend it will be used instead of a WS. Defaults to
        // false (SCTP is used only if available and no WS are available).
        // preferSctp: false
    },

    // Testing / experimental features.
    //

    testing: {
        // Allows the setting of a custom bandwidth value from the UI.
        // assumeBandwidth: true,

        // Disables the End to End Encryption feature. Useful for debugging
        // issues related to insertable streams.
        // disableE2EE: false,

        // Enables XMPP WebSocket (as opposed to BOSH) for the given amount of users.
        // mobileXmppWsThreshold: 10, // enable XMPP WebSockets on mobile for 10% of the users

        // P2P test mode disables automatic switching to P2P when there are 2
        // participants in the conference.
        // p2pTestMode: false,

        // Enables the test specific features consumed by jitsi-meet-torture
        // testMode: false,

        // Disables the auto-play behavior of *all* newly created video element.
        // This is useful when the client runs on a host with limited resources.
        // noAutoPlayVideo: false,

        // Enable callstats only for a percentage of users.
        // This takes a value between 0 and 100 which determines the probability for
        // the callstats to be enabled.
        // callStatsThreshold: 5, // enable callstats for 5% of the users.
    },

    // Disables moderator indicators.
    // disableModeratorIndicator: false,

    // Disables the reactions feature.
    // disableReactions: true,

    // Disables the reactions moderation feature.
    // disableReactionsModeration: false,

    // Disables polls feature.
    // disablePolls: false,

    // Disables self-view tile. (hides it from tile view and from filmstrip)
    // disableSelfView: false,

    // Disables self-view settings in UI
    // disableSelfViewSettings: false,

    // screenshotCapture : {
    //      Enables the screensharing capture feature.
    //      enabled: false,
    //
    //      The mode for the screenshot capture feature.
    //      Can be either 'recording' - screensharing screenshots are taken
    //      only when the recording is also on,
    //      or 'always' - screensharing screenshots are always taken.
    //      mode: 'recording',
    // }

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
    // startSilent: false,

    // Enables support for opus-red (redundancy for Opus).
    // enableOpusRed: false,

    // Specify audio quality stereo and opusMaxAverageBitrate values in order to enable HD audio.
    // Beware, by doing so, you are disabling echo cancellation, noise suppression and AGC.
    // Specify enableOpusDtx to enable support for opus-dtx where
    // audio packets won’t be transmitted while participant is silent or muted.
    // audioQuality: {
    //     stereo: false,
    //     opusMaxAverageBitrate: null, // Value to fit the 6000 to 510000 range.
    //     enableOpusDtx: false,
    // },

    // Noise suppression configuration. By default rnnoise is used. Optionally Krisp
    // can be used by enabling it below, but the Krisp JS SDK files must be supplied in your
    // installation. Specifically, these files are needed:
    //   - https://meet.example.com/libs/krisp/krisp.mjs
    //   - https://meet.example.com/libs/krisp/models/model_8.kw
    //   - https://meet.example.com/libs/krisp/models/model_16.kw
    //   - https://meet.example.com/libs/krisp/models/model_32.kw
    // NOTE: Krisp JS SDK v1.0.9 was tested.
    // noiseSuppression: {
    //     krisp: {
    //         enabled: false,
    //         logProcessStats: false,
    //         debugLogs: false,
    //     },
    // },

    // Video

    // Sets the default camera facing mode.
    // cameraFacingMode: 'user',

    // Sets the preferred resolution (height) for local video. Defaults to 720.
    // resolution: 720,

    // Specifies whether the raised hand will hide when someone becomes a dominant speaker or not
    // disableRemoveRaisedHandOnFocus: false,

    // speakerStats: {
    //     // Specifies whether the speaker stats is enable or not.
    //     disabled: false,

    //     // Specifies whether there will be a search field in speaker stats or not.
    //     disableSearch: false,

    //     // Specifies whether participants in speaker stats should be ordered or not, and with what priority.
    //     // 'role', <- Moderators on top.
    //     // 'name', <- Alphabetically by name.
    //     // 'hasLeft', <- The ones that have left in the bottom.
    //     order: [
    //         'role',
    //         'name',
    //         'hasLeft',
    //     ],
    // },

    // DEPRECATED. Please use speakerStats.disableSearch instead.
    // Specifies whether there will be a search field in speaker stats or not
    // disableSpeakerStatsSearch: false,

    // DEPRECATED. Please use speakerStats.order .
    // Specifies whether participants in speaker stats should be ordered or not, and with what priority
    // speakerStatsOrder: [
    //  'role', <- Moderators on top
    //  'name', <- Alphabetically by name
    //  'hasLeft', <- The ones that have left in the bottom
    // ], <- the order of the array elements determines priority

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
    //             min: 240,
    //         },
    //     },
    // },

    // Enable / disable simulcast support.
    // disableSimulcast: false,

    // Every participant after the Nth will start video muted.
    // startVideoMuted: 10,

    // Start calls with video muted. Unlike the option above, this one is only
    // applied locally. FIXME: having these 2 options is confusing.
    // startWithVideoMuted: false,

    // Desktop sharing

    // Optional desktop sharing frame rate options. Default value: min:5, max:5.
    // desktopSharingFrameRate: {
    //     min: 5,
    //     max: 5,
    // },

    // Optional screenshare settings that give more control over screen capture in the browser.
    // screenShareSettings: {
    //      // Show users the current tab is the preferred capture source, default: false.
    //      desktopPreferCurrentTab: false,
    //      // Allow users to select system audio, default: include.
    //      desktopSystemAudio: 'include',
    //      // Allow users to seamlessly switch which tab they are sharing without having to select the tab again.
    //      desktopSurfaceSwitching: 'include',
    //      // Allow a user to be shown a preference for what screen is to be captured, default: unset.
    //      desktopDisplaySurface: undefined,
    //      // Allow users to select the current tab as a capture source, default: exclude.
    //      desktopSelfBrowserSurface: 'exclude'
    // },

    // Recording

    // DEPRECATED. Use recordingService.enabled instead.
    // fileRecordingsEnabled: false,

    // Enable the dropbox integration.
    // dropbox: {
    //     appKey: '<APP_KEY>', // Specify your app key here.
    //     // A URL to redirect the user to, after authenticating
    //     // by default uses:
    //     // 'https://jitsi-meet.example.com/static/oauth.html'
    //     redirectURI:
    //          'https://jitsi-meet.example.com/subfolder/static/oauth.html',
    // },

    // recordingService: {
    //     // When integrations like dropbox are enabled only that will be shown,
    //     // by enabling fileRecordingsServiceEnabled, we show both the integrations
    //     // and the generic recording service (its configuration and storage type
    //     // depends on jibri configuration)
    //     enabled: false,

    //     // Whether to show the possibility to share file recording with other people
    //     // (e.g. meeting participants), based on the actual implementation
    //     // on the backend.
    //     sharingEnabled: false,

    //     // Hide the warning that says we only store the recording for 24 hours.
    //     hideStorageWarning: false,
    // },

    // DEPRECATED. Use recordingService.enabled instead.
    // fileRecordingsServiceEnabled: false,

    // DEPRECATED. Use recordingService.sharingEnabled instead.
    // fileRecordingsServiceSharingEnabled: false,

    // Local recording configuration.
    // localRecording: {
    //     // Whether to disable local recording or not.
    //     disable: false,

    //     // Whether to notify all participants when a participant is recording locally.
    //     notifyAllParticipants: false,

    //     // Whether to disable the self recording feature (only local participant streams).
    //     disableSelfRecording: false,
    // },

    // Customize the Live Streaming dialog. Can be modified for a non-YouTube provider.
    // liveStreaming: {
    //    // Whether to enable live streaming or not.
    //    enabled: false,
    //    // Terms link
    //    termsLink: 'https://www.youtube.com/t/terms',
    //    // Data privacy link
    //    dataPrivacyLink: 'https://policies.google.com/privacy',
    //    // RegExp string that validates the stream key input field
    //    validatorRegExpString: '^(?:[a-zA-Z0-9]{4}(?:-(?!$)|$)){4}',
    //    // Documentation reference for the live streaming feature.
    //    helpLink: 'https://jitsi.org/live'
    // },

    // DEPRECATED. Use liveStreaming.enabled instead.
    // liveStreamingEnabled: false,

    // DEPRECATED. Use transcription.enabled instead.
    // transcribingEnabled: false,

    // DEPRECATED. Use transcription.useAppLanguage instead.
    // transcribeWithAppLanguage: true,

    // DEPRECATED. Use transcription.preferredLanguage instead.
    // preferredTranscribeLanguage: 'en-US',

    // DEPRECATED. Use transcription.autoCaptionOnRecord instead.
    // autoCaptionOnRecord: false,

    // Transcription options.
    // transcription: {
    //     // Whether the feature should be enabled or not.
    //     enabled: false,

    //     // Translation languages.
    //     // Available languages can be found in
    //     // ./src/react/features/transcribing/translation-languages.json.
    //     translationLanguages: ['en', 'es', 'fr', 'ro'],

    //     // Important languages to show on the top of the language list.
    //     translationLanguagesHead: ['en'],

    //     // If true transcriber will use the application language.
    //     // The application language is either explicitly set by participants in their settings or automatically
    //     // detected based on the environment, e.g. if the app is opened in a chrome instance which
    //     // is using french as its default language then transcriptions for that participant will be in french.
    //     // Defaults to true.
    //     useAppLanguage: true,

    //     // Transcriber language. This settings will only work if "useAppLanguage"
    //     // is explicitly set to false.
    //     // Available languages can be found in
    //     // ./src/react/features/transcribing/transcriber-langs.json.
    //     preferredLanguage: 'en-US',

    //     // Disable start transcription for all participants.
    //     disableStartForAll: false,

    //     // Enables automatic turning on captions when recording is started
    //     autoCaptionOnRecord: false,
    // },

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

    // Specify the settings for video quality optimizations on the client.
    // videoQuality: {
    //
    //    // Provides a way to set the codec preference on desktop based endpoints.
    //    codecPreferenceOrder: [ 'VP9', 'VP8', 'H264' ],
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
    //              high: 1500000,
    //          },
    //          VP8 : {
    //              low: 200000,
    //              standard: 500000,
    //              high: 1500000,
    //          },
    //          VP9: {
    //              low: 100000,
    //              standard: 300000,
    //              high: 1200000,
    //          },
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
    //        720: 'high',
    //    },
    //
    //    // Provides a way to set the codec preference on mobile devices, both on RN and mobile browser based endpoint
    //    mobileCodecPreferenceOrder: [ 'VP8', 'VP9', 'H264' ],
    //
    //    // DEPRECATED! Use `codecPreferenceOrder/mobileCodecPreferenceOrder` instead.
    //    // Provides a way to prevent a video codec from being negotiated on the JVB connection. The codec specified
    //    // here will be removed from the list of codecs present in the SDP answer generated by the client. If the
    //    // same codec is specified for both the disabled and preferred option, the disable settings will prevail.
    //    // Note that 'VP8' cannot be disabled since it's a mandatory codec, the setting will be ignored in this case.
    //    disabledCodec: 'H264',
    //
    //    // DEPRECATED! Use `codecPreferenceOrder/mobileCodecPreferenceOrder` instead.
    //    // Provides a way to set a preferred video codec for the JVB connection. If 'H264' is specified here,
    //    // simulcast will be automatically disabled since JVB doesn't support H264 simulcast yet. This will only
    //    // rearrange the the preference order of the codecs in the SDP answer generated by the browser only if the
    //    // preferred codec specified here is present. Please ensure that the JVB offers the specified codec for this
    //    // to take effect.
    //    preferredCodec: 'VP8',
    //
    // },

    // Notification timeouts
    // notificationTimeouts: {
    //     short: 2500,
    //     medium: 5000,
    //     long: 10000,
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
    //    appURL: 'https://unlimited.recordings.app.com/',
    // },

    // Disables or enables RTX (RFC 4588) (defaults to false).
    // disableRtx: false,

    // Moves all Jitsi Meet 'beforeunload' logic (cleanup, leaving, disconnecting, etc) to the 'unload' event.
    // disableBeforeUnloadHandlers: true,

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

    // DEPRECATED. Please use `securityUi?.hideLobbyButton` instead.
    // Hides lobby button.
    // hideLobbyButton: false,

    // DEPRECATED. Please use `lobby?.autoKnock` instead.
    // If Lobby is enabled starts knocking automatically.
    // autoKnockLobby: false,

    // DEPRECATED. Please use `lobby?.enableChat` instead.
    // Enable lobby chat.
    // enableLobbyChat: true,

    // DEPRECATED! Use `breakoutRooms.hideAddRoomButton` instead.
    // Hides add breakout room button
    // hideAddRoomButton: false,

    // Require users to always specify a display name.
    // requireDisplayName: true,

    // Enables webhid functionality for Audio.
    // enableWebHIDFeature: false,

    // DEPRECATED! Use 'welcomePage.disabled' instead.
    // Whether to use a welcome page or not. In case it's false a random room
    // will be joined when no room is specified.
    // enableWelcomePage: true,

    // Configs for welcome page.
    // welcomePage: {
    //     // Whether to disable welcome page. In case it's disabled a random room
    //     // will be joined when no room is specified.
    //     disabled: false,
    //     // If set,landing page will redirect to this URL.
    //     customUrl: ''
    // },

    // Configs for the lobby screen.
    // lobby: {
    //     // If Lobby is enabled, it starts knocking automatically. Replaces `autoKnockLobby`.
    //     autoKnock: false,
    //     // Enables the lobby chat. Replaces `enableLobbyChat`.
    //     enableChat: true,
    // },

    // Configs for the security related UI elements.
    // securityUi: {
    //     // Hides the lobby button. Replaces `hideLobbyButton`.
    //     hideLobbyButton: false,
    //     // Hides the possibility to set and enter a lobby password.
    //     disableLobbyPassword: false,
    // },

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

    // Default local name to be displayed
    // defaultLocalDisplayName: 'me',

    // Default remote name to be displayed
    // defaultRemoteDisplayName: 'Fellow Jitster',

    // Hides the display name from the participant thumbnail
    // hideDisplayName: false,

    // Hides the dominant speaker name badge that hovers above the toolbox
    // hideDominantSpeakerBadge: false,

    // Default language for the user interface. Cannot be overwritten.
    // DEPRECATED! Use the `lang` iframe option directly instead.
    // defaultLanguage: 'en',

    // Disables profile and the edit of all fields from the profile settings (display name and email)
    // disableProfile: false,

    // Hides the email section under profile settings.
    // hideEmailInSettings: false,

    // When enabled the password used for locking a room is restricted to up to the number of digits specified
    // default: roomPasswordNumberOfDigits: false,
    // roomPasswordNumberOfDigits: 10,

    // Message to show the users. Example: 'The service will be down for
    // maintenance at 01:00 AM GMT,
    // noticeMessage: '',

    // Enables calendar integration, depends on googleApiApplicationClientID
    // and microsoftApiApplicationClientID
    // enableCalendarIntegration: false,

    // Configs for prejoin page.
    // prejoinConfig: {
    //     // When 'true', it shows an intermediate page before joining, where the user can configure their devices.
    //     // This replaces `prejoinPageEnabled`.
    //     enabled: true,
    //     // Hides the participant name editing field in the prejoin screen.
    //     // If requireDisplayName is also set as true, a name should still be provided through
    //     // either the jwt or the userInfo from the iframe api init object in order for this to have an effect.
    //     hideDisplayName: false,
    //     // List of buttons to hide from the extra join options dropdown.
    //     hideExtraJoinButtons: ['no-audio', 'by-phone'],
    // },

    // When 'true', the user cannot edit the display name.
    // (Mainly useful when used in conjunction with the JWT so the JWT name becomes read only.)
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

    // Array with avatar URL prefixes that need to use CORS.
    // corsAvatarURLs: [ 'https://www.gravatar.com/avatar/' ],

    // Base URL for a Gravatar-compatible service. Defaults to Gravatar.
    // DEPRECATED! Use `gravatar.baseUrl` instead.
    // gravatarBaseURL: 'https://www.gravatar.com/avatar/',

    // Setup for Gravatar-compatible services.
    // gravatar: {
    //     // Defaults to Gravatar.
    //     baseUrl: 'https://www.gravatar.com/avatar/',
    //     // True if Gravatar should be disabled.
    //     disabled: false,
    // },

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
    //    'highlight',
    //    'invite',
    //    'linktosalesforce',
    //    'livestreaming',
    //    'microphone',
    //    'noisesuppression',
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
    //    'whiteboard',
    // ],

    // Holds values related to toolbar visibility control.
    // toolbarConfig: {
    //     // Moved from interfaceConfig.INITIAL_TOOLBAR_TIMEOUT
    //     // The initial number of milliseconds for the toolbar buttons to be visible on screen.
    //     initialTimeout: 20000,
    //     // Moved from interfaceConfig.TOOLBAR_TIMEOUT
    //     // Number of milliseconds for the toolbar buttons to be visible on screen.
    //     timeout: 4000,
    //     // Moved from interfaceConfig.TOOLBAR_ALWAYS_VISIBLE
    //     // Whether toolbar should be always visible or should hide after x milliseconds.
    //     alwaysVisible: false,
    //     // Indicates whether the toolbar should still autohide when chat is open
    //     autoHideWhileChatIsOpen: false,
    // },

    // Toolbar buttons which have their click/tap event exposed through the API on
    // `toolbarButtonClicked`. Passing a string for the button key will
    // prevent execution of the click/tap routine; passing an object with `key` and
    // `preventExecution` flag on false will not prevent execution of the click/tap
    // routine. Below array with mixed mode for passing the buttons.
    // buttonsWithNotifyClick: [
    //     'camera',
    //     {
    //         key: 'chat',
    //         preventExecution: false
    //     },
    //     {
    //         key: 'closedcaptions',
    //         preventExecution: true
    //     },
    //     'desktop',
    //     'download',
    //     'embedmeeting',
    //     'end-meeting',
    //     'etherpad',
    //     'feedback',
    //     'filmstrip',
    //     'fullscreen',
    //     'hangup',
    //     'hangup-menu',
    //     'help',
    //     {
    //         key: 'invite',
    //         preventExecution: false
    //     },
    //     'livestreaming',
    //     'microphone',
    //     'mute-everyone',
    //     'mute-video-everyone',
    //     'noisesuppression',
    //     'participants-pane',
    //     'profile',
    //     {
    //         key: 'raisehand',
    //         preventExecution: true
    //     },
    //     'recording',
    //     'security',
    //     'select-background',
    //     'settings',
    //     'shareaudio',
    //     'sharedvideo',
    //     'shortcuts',
    //     'stats',
    //     'tileview',
    //     'toggle-camera',
    //     'videoquality',
    //     // The add passcode button from the security dialog.
    //     {
    //         key: 'add-passcode',
    //         preventExecution: false
    //     },
    //     'whiteboard',
    // ],

    // Participant context menu buttons which have their click/tap event exposed through the API on
    // `participantMenuButtonClick`. Passing a string for the button key will
    // prevent execution of the click/tap routine; passing an object with `key` and
    // `preventExecution` flag on false will not prevent execution of the click/tap
    // routine. Below array with mixed mode for passing the buttons.
    // participantMenuButtonsWithNotifyClick: [
    //     'allow-video',
    //     {
    //         key: 'ask-unmute',
    //         preventExecution: false
    //     },
    //     'conn-status',
    //     'flip-local-video',
    //     'grant-moderator',
    //     {
    //         key: 'kick',
    //         preventExecution: true
    //     },
    //     {
    //         key: 'hide-self-view',
    //         preventExecution: false
    //     },
    //     'mute',
    //     'mute-others',
    //     'mute-others-video',
    //     'mute-video',
    //     'pinToStage',
    //     'privateMessage',
    //     {
    //         key: 'remote-control',
    //         preventExecution: false
    //     },
    //     'send-participant-to-room',
    //     'verify',
    // ],

    // List of pre meeting screens buttons to hide. The values must be one or more of the 5 allowed buttons:
    // 'microphone', 'camera', 'select-background', 'invite', 'settings'
    // hiddenPremeetingButtons: [],

    // An array with custom option buttons for the participant context menu
    // type:  Array<{ icon: string; id: string; text: string; }>
    // customParticipantMenuButtons: [],

    // An array with custom option buttons for the toolbar
    // type:  Array<{ icon: string; id: string; text: string; backgroundColor?: string; }>
    // customToolbarButtons: [],

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
    // callStatsApplicationLogsDisabled: false,

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
    //         sessionID: "Session Identifier. Example, session-12-34",
    //     },
    //     collectLegacyStats: true, //enables the collection of legacy stats in chrome browser
    //     collectIP: true, //enables the collection localIP address
    // },

    // Enables sending participants' display names to callstats
    // enableDisplayNameInStats: false,

    // Enables sending participants' emails (if available) to callstats and other analytics
    // enableEmailInStats: false,

    // faceLandmarks: {
    //     // Enables sharing your face coordinates. Used for centering faces within a video.
    //     enableFaceCentering: false,

    //     // Enables detecting face expressions and sharing data with other participants
    //     enableFaceExpressionsDetection: false,

    //     // Enables displaying face expressions in speaker stats
    //     enableDisplayFaceExpressions: false,

    //     // Enable rtc stats for face landmarks
    //     enableRTCStats: false,

    //     // Minimum required face movement percentage threshold for sending new face centering coordinates data.
    //     faceCenteringThreshold: 10,

    //     // Milliseconds for processing a new image capture in order to detect face coordinates if they exist.
    //     captureInterval: 1000,
    // },

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

        // Sets the ICE transport policy for the p2p connection. At the time
        // of this writing the list of possible values are 'all' and 'relay',
        // but that is subject to change in the future. The enum is defined in
        // the WebRTC standard:
        // https://www.w3.org/TR/webrtc/#rtcicetransportpolicy-enum.
        // If not set, the effective value is 'all'.
        // iceTransportPolicy: 'all',

        // Provides a way to set the codec preference on mobile devices, both on RN and mobile browser based
        // endpoints.
        // mobileCodecPreferenceOrder: [ 'H264', 'VP8', 'VP9' ],
        //
        // Provides a way to set the codec preference on desktop based endpoints.
        // codecPreferenceOrder: [ 'VP9', 'VP8', 'H264 ],

        // How long we're going to wait, before going back to P2P after the 3rd
        // participant has left the conference (to filter out page reload).
        // backToP2PDelay: 5,

        // The STUN servers that will be used in the peer to peer connections
        stunServers: [

            // { urls: 'stun:jitsi-meet.example.com:3478' },
            { urls: 'stun:meet-jit-si-turnrelay.jitsi.net:443' },
        ],

        // DEPRECATED! Use `codecPreferenceOrder/mobileCodecPreferenceOrder` instead.
        // Provides a way to set the video codec preference on the p2p connection. Acceptable
        // codec values are 'VP8', 'VP9' and 'H264'.
        // preferredCodec: 'H264',

        // DEPRECATED! Use `codecPreferenceOrder/mobileCodecPreferenceOrder` instead.
        // Provides a way to prevent a video codec from being negotiated on the p2p connection.
        // disabledCodec: '',
    },

    analytics: {
        // True if the analytics should be disabled
        // disabled: false,

        // The Google Analytics Tracking ID:
        // googleAnalyticsTrackingId: 'your-tracking-id-UA-123456-1',

        // Matomo configuration:
        // matomoEndpoint: 'https://your-matomo-endpoint/',
        // matomoSiteID: '42',

        // The Amplitude APP Key:
        // amplitudeAPPKey: '<APP_KEY>',

        // Enables Amplitude UTM tracking:
        // Default value is false.
        // amplitudeIncludeUTM: false,

        // Obfuscates room name sent to analytics (amplitude, rtcstats)
        // Default value is false.
        // obfuscateRoomName: false,

        // Configuration for the rtcstats server:
        // By enabling rtcstats server every time a conference is joined the rtcstats
        // module connects to the provided rtcstatsEndpoint and sends statistics regarding
        // PeerConnection states along with getStats metrics polled at the specified
        // interval.
        // rtcstatsEnabled: false,
        // rtcstatsStoreLogs: false,

        // In order to enable rtcstats one needs to provide a endpoint url.
        // rtcstatsEndpoint: wss://rtcstats-server-pilot.jitsi.net/,

        // The interval at which rtcstats will poll getStats, defaults to 10000ms.
        // If the value is set to 0 getStats won't be polled and the rtcstats client
        // will only send data related to RTCPeerConnection events.
        // rtcstatsPollInterval: 10000,

        // This determines if rtcstats sends the SDP to the rtcstats server or replaces
        // all SDPs with an empty string instead.
        // rtcstatsSendSdp: false,

        // Array of script URLs to load as lib-jitsi-meet "analytics handlers".
        // scriptURLs: [
        //      "libs/analytics-ga.min.js", // google-analytics
        //      "https://example.com/my-custom-analytics.js",
        // ],

        // By enabling watchRTCEnabled option you would want to use watchRTC feature
        // This would also require to configure watchRTCConfigParams.
        // Please remember to keep rtcstatsEnabled disabled for watchRTC to work.
        // watchRTCEnabled: false,
    },

    // Logs that should go be passed through the 'log' event if a handler is defined for it
    // apiLogLevels: ['warn', 'log', 'error', 'info', 'debug'],

    // Information about the jitsi-meet instance we are connecting to, including
    // the user region as seen by the server.
    // deploymentInfo: {
    //     shard: "shard1",
    //     region: "europe",
    //     userRegion: "asia",
    // },

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
    //     edgeUrl: 'https://microsoftedge.microsoft.com/addons/detail/jitsi-meetings/eeecajlpbgjppibfledfihobcabccihn',

    //     // Extensions info which allows checking if they are installed or not
    //     chromeExtensionsInfo: [
    //         {
    //             id: 'kglhbbefdnlheedjiejgomgmfplipfeb',
    //             path: 'jitsi-logo-48x48.png',
    //         },
    //         // Edge extension info
    //         {
    //             id: 'eeecajlpbgjppibfledfihobcabccihn',
    //             path: 'jitsi-logo-48x48.png',
    //         },
    //     ]
    // },

    // e2ee: {
    //   labels: {
    //     description: '',
    //     label: '',
    //     tooltip: '',
    //     warning: '',
    //   },
    //   externallyManagedKey: false,
    // },

    // Options related to end-to-end (participant to participant) ping.
    // e2eping: {
    //   // Whether ene-to-end pings should be enabled.
    //   enabled: false,
    //
    //   // The number of responses to wait for.
    //   numRequests: 5,
    //
    //   // The max conference size in which e2e pings will be sent.
    //   maxConferenceSize: 200,
    //
    //   // The maximum number of e2e ping messages per second for the whole conference to aim for.
    //   // This is used to control the pacing of messages in order to reduce the load on the backend.
    //   maxMessagesPerSecond: 250,
    // },

    // If set, will attempt to use the provided video input device label when
    // triggering a screenshare, instead of proceeding through the normal flow
    // for obtaining a desktop stream.
    // NOTE: This option is experimental and is currently intended for internal
    // use only.
    // _desktopSharingSourceDevice: 'sample-id-or-label',

    // DEPRECATED! Use deeplinking.disabled instead.
    // If true, any checks to handoff to another application will be prevented
    // and instead the app will continue to display in the current browser.
    // disableDeepLinking: false,

    // The deeplinking config.
    // For information about the properties of
    // deeplinking.[ios/android].dynamicLink check:
    // https://firebase.google.com/docs/dynamic-links/create-manually
    // deeplinking: {
    //
    //     // The desktop deeplinking config.
    //     desktop: {
    //         appName: 'Jitsi Meet'
    //     },
    //     // If true, any checks to handoff to another application will be prevented
    //     // and instead the app will continue to display in the current browser.
    //     disabled: false,

    //     // whether to hide the logo on the deep linking pages.
    //     hideLogo: false,

    //     // The ios deeplinking config.
    //     ios: {
    //         appName: 'Jitsi Meet',
    //         // Specify mobile app scheme for opening the app from the mobile browser.
    //         appScheme: 'org.jitsi.meet',
    //         // Custom URL for downloading ios mobile app.
    //         downloadLink: 'https://itunes.apple.com/us/app/jitsi-meet/id1165103905',
    //         dynamicLink: {
    //             apn: 'org.jitsi.meet',
    //             appCode: 'w2atb',
    //             customDomain: undefined,
    //             ibi: 'com.atlassian.JitsiMeet.ios',
    //             isi: '1165103905'
    //         }
    //     },

    //     // The android deeplinking config.
    //     android: {
    //         appName: 'Jitsi Meet',
    //         // Specify mobile app scheme for opening the app from the mobile browser.
    //         appScheme: 'org.jitsi.meet',
    //         // Custom URL for downloading android mobile app.
    //         downloadLink: 'https://play.google.com/store/apps/details?id=org.jitsi.meet',
    //         // Android app package name.
    //         appPackage: 'org.jitsi.meet',
    //         fDroidUrl: 'https://f-droid.org/en/packages/org.jitsi.meet/',
    //         dynamicLink: {
    //             apn: 'org.jitsi.meet',
    //             appCode: 'w2atb',
    //             customDomain: undefined,
    //             ibi: 'com.atlassian.JitsiMeet.ios',
    //             isi: '1165103905'
    //         }
    //     }
    // },

    // // The terms, privacy and help centre URL's.
    // legalUrls: {
    //     helpCentre: 'https://web-cdn.jitsi.net/faq/meet-faq.html',
    //     privacy: 'https://jitsi.org/meet/privacy',
    //     terms: 'https://jitsi.org/meet/terms'
    // },

    // A property to disable the right click context menu for localVideo
    // the menu has option to flip the locally seen video for local presentations
    // disableLocalVideoFlip: false,

    // A property used to unset the default flip state of the local video.
    // When it is set to 'true', the local(self) video will not be mirrored anymore.
    // doNotFlipLocalVideo: false,

    // Mainly privacy related settings

    // Disables all invite functions from the app (share, invite, dial out...etc)
    // disableInviteFunctions: true,

    // Disables storing the room name to the recents list. When in an iframe this is ignored and
    // the room is never stored in the recents list.
    // doNotStoreRoom: true,

    // Deployment specific URLs.
    // deploymentUrls: {
    //    // If specified a 'Help' button will be displayed in the overflow menu with a link to the specified URL for
    //    // user documentation.
    //    userDocumentationURL: 'https://docs.example.com/video-meetings.html',
    //    // If specified a 'Download our apps' button will be displayed in the overflow menu with a link
    //    // to the specified URL for an app download page.
    //    downloadAppsUrl: 'https://docs.example.com/our-apps.html',
    // },

    // Options related to the remote participant menu.
    // remoteVideoMenu: {
    //     // Whether the remote video context menu to be rendered or not.
    //     disabled: true,
    //     // If set to true the 'Kick out' button will be disabled.
    //     disableKick: true,
    //     // If set to true the 'Grant moderator' button will be disabled.
    //     disableGrantModerator: true,
    //     // If set to true the 'Send private message' button will be disabled.
    //     disablePrivateChat: true,
    // },

    // Endpoint that enables support for salesforce integration with in-meeting resource linking
    // This is required for:
    // listing the most recent records - salesforceUrl/records/recents
    // searching records - salesforceUrl/records?text=${text}
    // retrieving record details - salesforceUrl/records/${id}?type=${type}
    // and linking the meeting - salesforceUrl/sessions/${sessionId}/records/${id}
    //
    // salesforceUrl: 'https://api.example.com/',

    // If set to true all muting operations of remote participants will be disabled.
    // disableRemoteMute: true,

    // Enables support for lip-sync for this client (if the browser supports it).
    // enableLipSync: false,

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
        virtualBackgrounds: ['https://example.com/img.jpg'],
        // Object containing customized icons that should replace the default ones.
        // The keys need to be the exact same icon names used in here:
        // https://github.com/jitsi/jitsi-meet/blob/master/react/features/base/icons/svg/index.ts
        // To avoid having the icons trimmed or displayed in an unexpected way, please provide svg
        // files containing svg xml icons in the size that the default icons come in.
        customIcons: {
            IconArrowUp: 'https://example.com/arrow-up.svg',
            IconDownload: 'https://example.com/download.svg',
            IconRemoteControlStart: 'https://example.com/remote-start.svg',
        },
        // Object containing a theme's properties. It also supports partial overwrites of the main theme.
        // For a list of all possible theme tokens and their current defaults, please check:
        // https://github.com/jitsi/jitsi-meet/tree/master/resources/custom-theme/custom-theme.json
        // For a short explanations on each of the tokens, please check:
        // https://github.com/jitsi/jitsi-meet/blob/master/react/features/base/ui/Tokens.ts
        // IMPORTANT!: This is work in progress so many of the various tokens are not yet applied in code
        // or they are partially applied.
        customTheme: {
            palette: {
                ui01: "orange !important",
                ui02: "maroon",
                surface02: 'darkgreen',
                ui03: "violet",
                ui04: "magenta",
                ui05: "blueviolet",
                action01: 'green',
                action01Hover: 'lightgreen',
                disabled01: 'beige',
                success02: 'cadetblue',
                action02Hover: 'aliceblue',
            },
            typography: {
                labelRegular: {
                    fontSize: 25,
                    lineHeight: 30,
                    fontWeight: 500,
                }
            }
        }
    }
    */
    // dynamicBrandingUrl: '',

    // Options related to the participants pane.
    // participantsPane: {
    //     // Hides the moderator settings tab.
    //     hideModeratorSettingsTab: false,
    //     // Hides the more actions button.
    //     hideMoreActionsButton: false,
    //     // Hides the mute all button.
    //     hideMuteAllButton: false,
    // },

    // Options related to the breakout rooms feature.
    // breakoutRooms: {
    //     // Hides the add breakout room button. This replaces `hideAddRoomButton`.
    //     hideAddRoomButton: false,
    //     // Hides the auto assign participants button.
    //     hideAutoAssignButton: false,
    //     // Hides the join breakout room button.
    //     hideJoinRoomButton: false,
    // },

    // When true, virtual background feature will be disabled.
    // disableVirtualBackground: false,

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

    // If true, the tiles will be displayed contained within the available space rather than enlarged to cover it,
    // with a 16:9 aspect ratio (old behaviour).
    // disableTileEnlargement: true,

    // Controls the visibility and behavior of the top header conference info labels.
    // If a label's id is not in any of the 2 arrays, it will not be visible at all on the header.
    // conferenceInfo: {
    //     // those labels will not be hidden in tandem with the toolbox.
    //     alwaysVisible: ['recording', 'raised-hands-count'],
    //     // those labels will be auto-hidden in tandem with the toolbox buttons.
    //     autoHide: [
    //         'subject',
    //         'conference-timer',
    //         'participants-count',
    //         'e2ee',
    //         'transcribing',
    //         'video-quality',
    //         'insecure-room',
    //         'highlight-moment',
    //         'top-panel-toggle',
    //     ]
    // },

    // Hides the conference subject
    // hideConferenceSubject: false,

    // Hides the conference timer.
    // hideConferenceTimer: false,

    // Hides the recording label
    // hideRecordingLabel: false,

    // Hides the participants stats
    // hideParticipantsStats: true,

    // Sets the conference subject
    // subject: 'Conference Subject',

    // Sets the conference local subject
    // localSubject: 'Conference Local Subject',

    // This property is related to the use case when jitsi-meet is used via the IFrame API. When the property is true
    // jitsi-meet will use the local storage of the host page instead of its own. This option is useful if the browser
    // is not persisting the local storage inside the iframe.
    // useHostPageLocalStorage: true,

    // Etherpad ("shared document") integration.
    //
    // If set, add a "Open shared document" link to the bottom right menu that
    // will open an etherpad document.
    // etherpad_base: 'https://your-etherpad-installati.on/p/',

    // To enable information about dial-in access to meetings you need to provide
    // dialInNumbersUrl and dialInConfCodeUrl.
    // dialInNumbersUrl returns a json array of numbers that can be used for dial-in.
    // {"countryCode":"US","tollFree":false,"formattedNumber":"+1 123-456-7890"}
    // dialInConfCodeUrl is the conference mapper converting a meeting id to a PIN used for dial-in
    // or the other way around (more info in resources/cloud-api.swagger)

    // You can use external service for authentication that will redirect back passing a jwt token
    // You can use tokenAuthUrl config to point to a URL of such service.
    // The URL for the service supports few params which will be filled in by the code.
    // tokenAuthUrl:
    //      'https://myservice.com/auth/{room}?code_challenge_method=S256&code_challenge={code_challenge}&state={state}'
    // Supported parameters in tokenAuthUrl:
    //      {room} - will be replaced with the room name
    //      {code_challenge} - (A web only). A oauth 2.0 code challenge that will be sent to the service. See:
    //          https://datatracker.ietf.org/doc/html/rfc7636. The code verifier will be saved in the sessionStorage
    //          under key: 'code_verifier'.
    //      {state} - A json with the current state before redirecting. Keys that are included in the state:
    //          - room (The current room name as shown in the address bar)
    //          - roomSafe (the backend safe room name to use (lowercase), that is passed to the backend)
    //          - tenant (The tenant if any)
    //          - config.xxx (all config overrides)
    //          - interfaceConfig.xxx (all interfaceConfig overrides)
    //          - ios=true (in case ios mobile app is used)
    //          - android=true (in case android mobile app is used)
    //          - electron=true (when web is loaded in electron app)
    // If there is a logout service you can specify its URL with:
    // tokenLogoutUrl: 'https://myservice.com/logout'
    // You can enable tokenAuthUrlAutoRedirect which will detect that you have logged in successfully before
    // and will automatically redirect to the token service to get the token for the meeting.
    // tokenAuthUrlAutoRedirect: false

    // List of undocumented settings used in jitsi-meet
    /**
     _immediateReloadThreshold
     debug
     debugAudioLevels
     deploymentInfo
     dialOutAuthUrl
     dialOutCodesUrl
     dialOutRegionUrl
     disableRemoteControl
     displayJids
     firefox_fake_device
     googleApiApplicationClientID
     iAmRecorder
     iAmSipGateway
     microsoftApiApplicationClientID
     peopleSearchQueryTypes
     peopleSearchUrl
     requireDisplayName
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
     avgRtpStatsN
     callStatsConfIDNamespace
     callStatsCustomScriptUrl
     desktopSharingSources
     disableAEC
     disableAGC
     disableAP
     disableHPF
     disableLocalStats
     disableNS
     enableTalkWhileMuted
     forceTurnRelay
     hiddenDomain
     hiddenFromRecorderFeatureEnabled
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
    //     'dialog.cameraConstraintFailedError', // shown when the camera failed
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
    //     'dialog.screenSharingFailedTitle', // shown when the screen sharing failed
    //     'dialog.serviceUnavailable', // shown when server is not reachable
    //     'dialog.sessTerminated', // shown when there is a failed conference session
    //     'dialog.sessionRestarted', // show when a client reload is initiated because of bridge migration
    //     'dialog.tokenAuthFailed', // show when an invalid jwt is used
    //     'dialog.tokenAuthFailedWithReasons', // show when an invalid jwt is used with the reason behind the error
    //     'dialog.transcribing', // transcribing notifications (pending, off)
    //     'dialOut.statusMessage', // shown when dial out status is updated.
    //     'liveStreaming.busy', // shown when livestreaming service is busy
    //     'liveStreaming.failedToStart', // shown when livestreaming fails to start
    //     'liveStreaming.unavailableTitle', // shown when livestreaming service is not reachable
    //     'lobby.joinRejectedMessage', // shown when while in a lobby, user's request to join is rejected
    //     'lobby.notificationTitle', // shown when lobby is toggled and when join requests are allowed / denied
    //     'notify.audioUnmuteBlockedTitle', // shown when mic unmute blocked
    //     'notify.chatMessages', // shown when receiving chat messages while the chat window is closed
    //     'notify.connectedOneMember', // show when a participant joined
    //     'notify.connectedThreePlusMembers', // show when more than 2 participants joined simultaneously
    //     'notify.connectedTwoMembers', // show when two participants joined simultaneously
    //     'notify.dataChannelClosed', // shown when the bridge channel has been disconnected
    //     'notify.hostAskedUnmute', // shown to participant when host asks them to unmute
    //     'notify.invitedOneMember', // shown when 1 participant has been invited
    //     'notify.invitedThreePlusMembers', // shown when 3+ participants have been invited
    //     'notify.invitedTwoMembers', // shown when 2 participants have been invited
    //     'notify.kickParticipant', // shown when a participant is kicked
    //     'notify.leftOneMember', // show when a participant left
    //     'notify.leftThreePlusMembers', // show when more than 2 participants left simultaneously
    //     'notify.leftTwoMembers', // show when two participants left simultaneously
    //     'notify.linkToSalesforce', // shown when joining a meeting with salesforce integration
    //     'notify.localRecordingStarted', // shown when the local recording has been started
    //     'notify.localRecordingStopped', // shown when the local recording has been stopped
    //     'notify.moderationInEffectCSTitle', // shown when user attempts to share content during AV moderation
    //     'notify.moderationInEffectTitle', // shown when user attempts to unmute audio during AV moderation
    //     'notify.moderationInEffectVideoTitle', // shown when user attempts to enable video during AV moderation
    //     'notify.moderator', // shown when user gets moderator privilege
    //     'notify.mutedRemotelyTitle', // shown when user is muted by a remote party
    //     'notify.mutedTitle', // shown when user has been muted upon joining,
    //     'notify.newDeviceAudioTitle', // prompts the user to use a newly detected audio device
    //     'notify.newDeviceCameraTitle', // prompts the user to use a newly detected camera
    //     'notify.noiseSuppressionFailedTitle', // shown when failed to start noise suppression
    //     'notify.participantWantsToJoin', // shown when lobby is enabled and participant requests to join meeting
    //     'notify.participantsWantToJoin', // shown when lobby is enabled and participants request to join meeting
    //     'notify.passwordRemovedRemotely', // shown when a password has been removed remotely
    //     'notify.passwordSetRemotely', // shown when a password has been set remotely
    //     'notify.raisedHand', // shown when a partcipant used raise hand,
    //     'notify.screenShareNoAudio', // shown when the audio could not be shared for the selected screen
    //     'notify.screenSharingAudioOnlyTitle', // shown when the best performance has been affected by screen sharing
    //     'notify.selfViewTitle', // show "You can always un-hide the self-view from settings"
    //     'notify.startSilentTitle', // shown when user joined with no audio
    //     'notify.suboptimalExperienceTitle', // show the browser warning
    //     'notify.unmute', // shown to moderator when user raises hand during AV moderation
    //     'notify.videoMutedRemotelyTitle', // shown when user's video is muted by a remote party,
    //     'notify.videoUnmuteBlockedTitle', // shown when camera unmute and desktop sharing are blocked
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
    //     'transcribing.failedToStart', // shown when transcribing fails to start
    // ],

    // List of notifications to be disabled. Works in tandem with the above setting.
    // disabledNotifications: [],

    // Prevent the filmstrip from autohiding when screen width is under a certain threshold
    // disableFilmstripAutohiding: false,

    // filmstrip: {
    //     // Disable the vertical/horizonal filmstrip.
    //     disabled: false,
    //     // Disables user resizable filmstrip. Also, allows configuration of the filmstrip
    //     // (width, tiles aspect ratios) through the interfaceConfig options.
    //     disableResizable: false,

    //     // Disables the stage filmstrip
    //     // (displaying multiple participants on stage besides the vertical filmstrip)
    //     disableStageFilmstrip: false,

    //     // Default number of participants that can be displayed on stage.
    //     // The user can change this in settings. Number must be between 1 and 6.
    //     stageFilmstripParticipants: 1,

    //     // Disables the top panel (only shown when a user is sharing their screen).
    //     disableTopPanel: false,

    //     // The minimum number of participants that must be in the call for
    //     // the top panel layout to be used.
    //     minParticipantCountForTopPanel: 50,
    // },

    // Tile view related config options.
    // tileView: {
    //     // Whether tileview should be disabled.
    //     disabled: false,
    //     // The optimal number of tiles that are going to be shown in tile view. Depending on the screen size it may
    //     // not be possible to show the exact number of participants specified here.
    //     numberOfVisibleTiles: 25,
    // },

    // Specifies whether the chat emoticons are disabled or not
    // disableChatSmileys: false,

    // Settings for the GIPHY integration.
    // giphy: {
    //     // Whether the feature is enabled or not.
    //     enabled: false,
    //     // SDK API Key from Giphy.
    //     sdkKey: '',
    //     // Display mode can be one of:
    //     // - tile: show the GIF on the tile of the participant that sent it.
    //     // - chat: show the GIF as a message in chat
    //     // - all: all of the above. This is the default option
    //     displayMode: 'all',
    //     // How long the GIF should be displayed on the tile (in milliseconds).
    //     tileTime: 5000,
    //     // Limit results by rating: g, pg, pg-13, r. Default value: g.
    //     rating: 'pg',
    //     // The proxy server url for giphy requests in the web app.
    //     proxyUrl: 'https://giphy-proxy.example.com',
    // },

    // Logging
    // logging: {
    //      // Default log level for the app and lib-jitsi-meet.
    //      defaultLogLevel: 'trace',
    //      // Option to disable LogCollector (which stores the logs on CallStats).
    //      //disableLogCollector: true,
    //      // Individual loggers are customizable.
    //      loggers: {
    //      // The following are too verbose in their logging with the default level.
    //      'modules/RTC/TraceablePeerConnection.js': 'info',
    //      'modules/statistics/CallStats.js': 'info',
    //      'modules/xmpp/strophe.util.js': 'log',
    // },

    // Application logo url
    // defaultLogoUrl: 'images/watermark.svg',

    // Settings for the Excalidraw whiteboard integration.
    // whiteboard: {
    //     // Whether the feature is enabled or not.
    //     enabled: true,
    //     // The server used to support whiteboard collaboration.
    //     // https://github.com/jitsi/excalidraw-backend
    //     collabServerBaseUrl: 'https://excalidraw-backend.example.com',
    //     // The user access limit to the whiteboard, introduced as a means
    //     // to control the performance.
    //     userLimit: 25,
    //     // The url for more info about the whiteboard and its usage limitations.
    //     limitUrl: 'https://example.com/blog/whiteboard-limits,
    // },

    // The watchRTC initialize config params as described :
    // https://testrtc.com/docs/installing-the-watchrtc-javascript-sdk/#h-set-up-the-sdk
    // https://www.npmjs.com/package/@testrtc/watchrtc-sdk
    // watchRTCConfigParams: {
    //         /** Watchrtc api key */
    //         rtcApiKey: string;
    //         /** Identifier for the session */
    //         rtcRoomId?: string;
    //         /** Identifier for the current peer */
    //         rtcPeerId?: string;
    //         /**
    //          * ["tag1", "tag2", "tag3"]
    //          * @deprecated use 'keys' instead
    //          */
    //         rtcTags?: string[];
    //         /** { "key1": "value1", "key2": "value2"} */
    //         keys?: any;
    //         /** Enables additional logging */
    //         debug?: boolean;
    //         rtcToken?: string;
    //         /**
    //          * @deprecated No longer needed. Use "proxyUrl" instead.
    //          */
    //         wsUrl?: string;
    //         proxyUrl?: string;
    //         console?: {
    //             level: string;
    //             override: boolean;
    //         };
    //         allowBrowserLogCollection?: boolean;
    //         collectionInterval?: number;
    //         logGetStats?: boolean;
    // },
};

// Temporary backwards compatibility with old mobile clients.
config.flags = config.flags || {};
config.flags.sourceNameSignaling = true;
config.flags.sendMultipleVideoStreams = true;
config.flags.receiveMultipleVideoStreams = true;

// Set the default values for JaaS customers
if (enableJaaS) {
    config.dialInNumbersUrl = 'https://conference-mapper.jitsi.net/v1/access/dids';
    config.dialInConfCodeUrl = 'https://conference-mapper.jitsi.net/v1/access';
    config.roomPasswordNumberOfDigits = 10; // skip re-adding it (do not remove comment)
}
