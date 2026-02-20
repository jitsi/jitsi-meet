/* eslint-disable */

console.log("GT: loading fishmeet-config.js");

var config;

/* -- this is for localhost -- later
config.hosts = {
    ...config.hosts,
    domain: 'localhost',
    muc: 'conference.localhost'
};

config.bosh = 'http://localhost:5280/http-bind';
config.websocket = 'ws://localhost:5280/xmpp-websocket';
*/

config.disableSelfView = false;

// Filmstrip toggle icons [visibleIconUrl, hiddenIconUrl]
// When set, these image URLs are used instead of the default arrow icons
config.filmstripToggleIcons = ['fishmeet/PolygonRight.svg', 'fishmeet/PolygonLeft.svg'];

// Custom theme overrides using existing Jitsi palette tokens
// For visual styling, use fishmeet-overrides.css
config.customTheme = {
    ...config.customTheme,
    palette: {
        ...config.customTheme?.palette,
        // Override action colors (used for active speaker, links, etc.)
        action01: '#FE9C75',
        action01Hover: '#E88B64',
        // Override warning colors (used for raised hand)
        warning02: '#FE9C75'
    }
};

config.disableSelfViewSettings = true;

    // Enabling this will show a "Save Logs" link in the GSM popover that can be
    // used to collect debug information (XMPP IQs, SDP offer/answer cycles)
    // about the call.
config.enableSaveLogs = true; //set to true?  === this is very useful for debugging purpose, but later

    // Enabling this will hide the "Show More" link in the GSM popover that can be
    // used to display more statistics about the connection (IP, Port, protocol, etc).
    // disableShowMoreStats: true,
//==
config.enableOpusRed = true; // improve audio quality?? -- default is false??
config.speakerStats = {
    //     // Specifies whether the speaker stats is enable or not.
        disabled: true,

    //     // Specifies whether there will be a search field in speaker stats or not.
        disableSearch: true,
    };
        // Every participant after the Nth will start video muted.
config.startVideoMuted = 0;
config.startWithVideoMuted = true;

    // How many participants while in the tile view mode, before the receiving video quality is reduced from HD to SD.
    // Use -1 to disable.
    // maxFullResolutionParticipants: 2,

    // Desktop sharing
    // Optional desktop sharing frame rate options. Default value: min:5, max:5.
    // desktopSharingFrameRate: {
    //     min: 5,
    //     max: 5,
    // },
//==
//==
config.channelLastN = 4; //TODO??
config.startLastN = 2;

config.welcomePage = { ...config.welcomePage,
    customUrl: 'fishmeet-Welcome.html'
};
    // Enables forced reload of the client when the call is migrated as a result of
    // the bridge going down.
    // enableForcedReload: true,
//==

config.disableShortcuts = true;

    // Enable the reactions feature.
config.disableReactions = false;

    // Enabling the close page will ignore the welcome page redirection when
    // a call is hangup.
config.enableClosePage = true;
config.defaultRemoteDisplayName = 'fish';
config.disableProfile = true;
config.hideEmailInSettings = true;

    // <<BSF would want this, since they want to suupport a URL to invite others>> Configs for prejoin page.
    // but maybe, we do a custom page to collect a displayname, and the meeting pwd, and then in,
    // with all the defaults of no video, etc..., for now, fishmeet will not have a prejoin screen
    // prejoinConfig: {
    //     // When 'true', it shows an intermediate page before joining, where the user can configure their devices.
    //     // This replaces `prejoinPageEnabled`. Defaults to true.
    //     enabled: true,
    //     // Hides the participant name editing field in the prejoin screen.
    //     // If requireDisplayName is also set as true, a name should still be provided through
    //     // either the jwt or the userInfo from the iframe api init object in order for this to have an effect.
    //     hideDisplayName: false,
    //     // List of buttons to hide from the extra join options dropdown.
    //     hideExtraJoinButtons: ['no-audio', 'by-phone'],
    //     // Configuration for pre-call test
    //     // By setting preCallTestEnabled, you enable the pre-call test in the prejoin page.
    //     // ICE server credentials need to be provided over the preCallTestICEUrl
    //     preCallTestEnabled: false,
    //     preCallTestICEUrl: ''
    // },

config.prejoinConfig = {
    ...config.prejoinConfig,
    hideExtraJoinButtons: ['no-audio', 'by-phone'],
    enabled: true //false
};

    // Moved from interfaceConfig(TOOLBAR_BUTTONS).
    // The name of the toolbar buttons to display in the toolbar, including the
    // "More actions" menu. If present, the button will display. Exceptions are
    // "livestreaming" and "recording" which also require being a moderator and
    // some other values in config.js to be enabled. Also, the "profile" button will
    // not display for users with a JWT.
    // Notes:
    // - it's possible to reorder the buttons in the maintoolbar by changing the order of the mainToolbarButtons
    // - 'desktop' controls the "Share your screen" button
    // - if `toolbarButtons` is undefined, we fallback to enabling all buttons on the UI
//*********need to add a button on **** stop all incoming video */
//maybe it's re-purposing video quality
config.toolbarButtons = [
        'camera',
        'chat',
        'videoStream',
        //    'closedcaptions',
        'desktop',
        //    'download',
        //    'embedmeeting',
        //    'etherpad',
        //    'feedback',
        'filmstrip', //?
        //    'fullscreen',
        'hangup',
        //    'help',
        //    'highlight',
        //    'invite',
        //    'linktosalesforce',
        //    'livestreaming',
        'microphone',
        //    'noisesuppression',
        'participants-pane',
        //    'profile',
        'raisehand',
        'recording',
        //    'security',
        //    'select-background',
        //    'settings',
        //    'shareaudio',
        //    'sharedvideo',
        //    'shortcuts',
        //    'stats',
        'tileview',
        'toggle-camera'
        //'videoquality'  // make it a stop all incoming video button***
        //    'whiteboard',
    ];
    // Overrides the buttons displayed in the main toolbar. Depending on the screen size the number of displayed
    // buttons varies from 2 buttons to 8 buttons. Every array in the mainToolbarButtons array will replace the
    // corresponding default buttons configuration matched by the number of buttons specified in the array. Arrays with
    // more than 8 buttons or less then 2 buttons will be ignored. When there there isn't an override for a certain
    // configuration (for example when 3 buttons are displayed) the default jitsi-meet configuration will be used.
    // The order of the buttons in the array is preserved.
config.mainToolbarButtons = [
         [ 'microphone', 'camera', 'videoStream', 'desktop', 'chat', 'raisehand', 'reactions', 'participants-pane', 'tileview' ],
         [ 'microphone', 'camera', 'videoStream', 'desktop', 'chat', 'raisehand', 'participants-pane', 'tileview' ],
         [ 'microphone', 'camera', 'videoStream', 'desktop', 'chat', 'raisehand', 'participants-pane' ],
         [ 'microphone', 'camera', 'videoStream', 'desktop', 'chat', 'participants-pane' ],
         [ 'microphone', 'camera', 'videoStream', 'chat', 'participants-pane' ],
         [ 'microphone', 'camera', 'videoStream', 'chat' ],
         [ 'microphone', 'camera', 'videoStream' ]
    ];

// TODO / USEFUL HELP: this is so that lastN on toggle video can be tested with participlants on the same Lan
// Otherwise, the video will not route through JVB, and sent p2p
//config.p2p = {/*...config.p2p, */enabled: false };

config.feedbackPercentage = 100; // means 100%, it could be 0. ???? where is the feedback sent?
config.disableThirdPartyRequests = true;

    // Application logo url
//config.defaultLogoUrl = 'images/watermark.svg';
config.defaultLogoUrl = '';

    // Default language for the user interface. Cannot be overwritten.
    // DEPRECATED! Use the `lang` iframe option directly instead.
    // defaultLanguage: 'en',
config.defaultLanguage = 'zhCN'; //?? will this work, since it's moved to 'lang' iframe, but there is no iframe here
   // Message to show the users. Example: 'The service will be down for
    // maintenance at 01:00 AM GMT,
    // noticeMessage: '',
config.noticeMessage = ''; //== tihs shows up at the top of the conference -- we will be back soon';

    // Disables all invite functions from the app (share, invite, dial out...etc)
config.disableInviteFunctions = true;

    // Options related to the remote participant menu.
    //BSF: another provider might want the below to be true :
    // we need a version for china, disabling them all
config.remoteVideoMenu = {...config.remoteVideoMenu,
    disableKick: false,
    disableGrantModerator: true,
    disablePrivateChat: true
}
    //what is this ???? we need
    // dynamicBrandingUrl: '',

        // A list of allowed URL domains for shared video.
    //
    // NOTE:
    // '*' is allowed value and it will allow any URL to be used for shared video. We do not recommend using '*',
    // use it at your own risk!
config.sharedVideoAllowedURLDomains = ['*'];  // ???? uncleaer how it's used --- don't see the logic anywhere

    // Hides the conference subject
config.hideConferenceSubject = true;

    // Hide login button on auth dialog, you may want to enable this if you are using JWT tokens to authenticate users
config.hideLoginButton = true;  // but once login, which meeting to join???


//??? more research needed
    // An array with custom option buttons for the participant context menu
    // type:  Array<{ icon: string; id: string; text: string; }>
    // customParticipantMenuButtons: [],

    // An array with custom option buttons for the toolbar
    // type:  Array<{ icon: string; id: string; text: string; backgroundColor?: string; }>
    // customToolbarButtons: [],

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

    // deploymentUrls: {
    //    // If specified a 'Help' button will be displayed in the overflow menu with a link to the specified URL for
    //    // user documentation.
    //    userDocumentationURL: 'https://docs.example.com/video-meetings.html',
    //    // If specified a 'Download our apps' button will be displayed in the overflow menu with a link
    //    // to the specified URL for an app download page.
    //    downloadAppsUrl: 'https://docs.example.com/our-apps.html',
    // },

    /**
     External API url used to receive branding specific information.
     If there is no url set or there are missing fields, the defaults are applied.
     The config file should be in JSON.
     None of the fields are mandatory and the response must have the shape:
    {
        // Whether participant can only send group chat message if `send-groupchat` feature is enabled in jwt.
        groupChatRequiresPermission: false,
        // Whether participant can only create polls if `create-polls` feature is enabled in jwt.
        pollCreationRequiresPermission: false,
        // The domain url to apply (will replace the domain in the sharing conference link/embed section)
        inviteDomain: 'example-company.org',
        // The hex value for the colour used as background
        backgroundColor: '#fff',
        // The url for the image used as background
        backgroundImageUrl: 'https://example.com/background-img.png',
        // The anchor url used when clicking the logo image
        logoClickUrl: 'https://example-company.org',
        // The url used for the image used as logo
        logoImageUrl: 'https://example.com/logo-img.png',
        // Endpoint that enables support for salesforce integration with in-meeting resource linking
        // This is required for:
        // listing the most recent records - salesforceUrl/records/recents
        // searching records - salesforceUrl/records?text=${text}
        // retrieving record details - salesforceUrl/records/${id}?type=${type}
        // and linking the meeting - salesforceUrl/sessions/${sessionId}/records/${id}
        // salesforceUrl: 'https://api.example.com/',
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
config.participantsPane = {...config.participantsPane, hideModeratorSettingsTab: true, hideMoreActionsButton: false};
    // ??? will checkout the partipantspane to decide
    // Options related to the participants pane.
    // participantsPane: {
    //     // Enables feature
    //     enabled: true,
    //     // Hides the moderator settings tab.
    //     hideModeratorSettingsTab: false,
    //     // Hides the more actions button.
    //     hideMoreActionsButton: false,
    //     // Hides the mute all button.
    //     hideMuteAllButton: false,
    // },

    // defaults are correct ==
    // Options related to the breakout rooms feature.
    // breakoutRooms: {
    //     // Hides the add breakout room button. This replaces `hideAddRoomButton`.
    //     hideAddRoomButton: false,
    //     // Hides the auto assign participants button.
    //     hideAutoAssignButton: false,
    //     // Hides the join breakout room button.
    //     hideJoinRoomButton: false,
    // },

config.disableVirtualBackground = true;
    //?????*** except this feature is NOT well implemented** -- try higher CPU */
    // When true, virtual background feature will be disabled.
    // disableVirtualBackground: false,

    // Sets the background transparency level. '0' is fully transparent, '1' is opaque.
    // the value can be between 0 and 1 ==== ***  ???? experiment
    // backgroundAlpha: 1,

    // If true, tile view will not be enabled automatically when the participants count threshold is reached.
    // /??? unclear where is the threshold defined or define-able ????
    // disableTileView: true,

    // If true, the tiles will be displayed contained within the available space rather than enlarged to cover it,
    // with a 16:9 aspect ratio (old behaviour).
    // disableTileEnlargement: true,

    // ???? need to investigate
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
    //         'video-quality',
    //         'insecure-room',
    //         'highlight-moment',
    //         'top-panel-toggle',
    //     ]
    // },

    // Hides the conference timer.
    // hideConferenceTimer: false,

    // Hides the recording label
    // hideRecordingLabel: false,

    // Hides the participants stats
    // hideParticipantsStats: true,

    // To enable information about dial-in access to meetings you need to provide
    // dialInNumbersUrl and dialInConfCodeUrl.
    // dialInNumbersUrl returns a json array of numbers that can be used for dial-in.
    // {"countryCode":"US","tollFree":false,"formattedNumber":"+1 123-456-7890"}
    // dialInConfCodeUrl is the conference mapper converting a meeting id to a PIN used for dial-in
    // or the other way around (more info in resources/cloud-api.swagger)

    //???? this is weird settings -- ???? we do have display name ****
    // Replaces the display name with the JID of the participants.
    // displayJids: true,

    // Enables disables talk while muted detection.
    // enableTalkWhileMuted: true,   //// what is this ????

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
    //     'notify.raisedHand', // shown when a participant used raise hand,
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
    //     'transcribing.failed', // shown when transcribing fails
    // ],

    // List of notifications to be disabled. Works in tandem with the above setting.
    // disabledNotifications: [],

    // Prevent the filmstrip from autohiding when screen width is under a certain threshold
    // disableFilmstripAutohiding: false,

config.filmstrip = {...config.filmstrip, disableStageFilmstrip: true};
    // filmstrip: {
    //     // Disable the vertical/horizontal filmstrip.
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

    //     // The width of the filmstrip on joining meeting. Can be resized afterwards.
    //     initialWidth: 400,

    //     // Whether the draggable resize bar of the filmstrip is always visible. Setting this to true will make
    //     // the filmstrip always visible in case `disableResizable` is false.
    //     alwaysShowResizeBar: true,
    // },

config.tileView = {...config.tileView, numberOfVisibleTiles: 9}; // Zoom offers 25 or 9 as two optoins to choose 1... this impacts lastN
    //??? TODO: might be the lastN is 4 for users from china, and the client shoud set his lastN to 4, and then this value is
    // also 4 for china users
    // Tile view related config options.
    // tileView: {
    //     // Whether tileview should be disabled.
    //     disabled: false,
    //     // The optimal number of tiles that are going to be shown in tile view. Depending on the screen size it may
    //     // not be possible to show the exact number of participants specified here.
    //     numberOfVisibleTiles: 25,
    // },

    // Logging
    //????? we want the user to enable log,and send us something for remote debugging???
    // logging: {
    //      // Default log level for the app and lib-jitsi-meet.
    //      defaultLogLevel: 'trace',
    //      // Option to disable LogCollector.
    //      //disableLogCollector: true,
    //      // Individual loggers are customizable.
    //      loggers: {
    //          // The following are too verbose in their logging with the default level.
    //          'modules/RTC/TraceablePeerConnection.js': 'info',
    //          'modules/xmpp/strophe.util.js': 'log',
    //      },
    // },


    //**** ????  */
    // If true remove the tint foreground on focused user camera in filmstrip
    config.disableCameraTintForeground = true;

    // List of pre meeting screens buttons to hide. The values must be one or more of the 5 allowed buttons:
    // 'microphone', 'camera', 'select-background', 'invite', 'settings'
    config.hiddenPremeetingButtons = ['invite', 'settings'];


/// interface_config.js section
/* eslint-disable no-unused-vars, no-var, max-len */
/* eslint sort-keys: ["error", "asc", {"caseSensitive": false}] */

/**
 * !!!IMPORTANT!!!
 *
 * This file is considered deprecated. All options will eventually be moved to
 * config.js, and no new options should be added here.
 */

var interfaceConfig;

interfaceConfig.APP_NAME = 'Fishmeet';
interfaceConfig.BRAND_WATERMARK_LINK = ''; // TODO:
interfaceConfig.DEFAULT_BACKGROUND = '#040404'; // TODO
interfaceConfig.DISABLE_TRANSCRIPTION_SUBTITLES = true;

    /**
     * Whether or not the blurred video background for large video should be
     * displayed on browsers that can support it.
     */
    //DISABLE_VIDEO_BACKGROUND: false,

interfaceConfig.ENABLE_DIAL_OUT = false;

    //TODO
    //FILM_STRIP_MAX_HEIGHT: 120,

interfaceConfig.HIDE_INVITE_MORE_HEADER = true;

    //TODO:
    //JITSI_WATERMARK_LINK: 'https://jitsi.org',

    /**
     * Whether the mobile app Jitsi Meet is to be promoted to participants
     * attempting to join a conference in a mobile Web browser. If
     * {@code undefined}, defaults to {@code true}.
     *
     * @type {boolean}
     */
interfaceConfig.MOBILE_APP_PROMO = false;

    // Names of browsers which should show a warning stating the current browser
    // has a suboptimal experience. Browsers which are not listed as optimal or
    // unsupported are considered suboptimal. Valid values are:
    // chrome, chromium, electron, firefox , safari, webkit
    //OPTIMAL_BROWSERS: [ 'chrome', 'chromium', 'firefox', 'electron', 'safari', 'webkit' ],

    //TODO:
    // POLICY_LOGO: null,
interfaceConfig.PROVIDER_NAME = 'fishmeet',

    /**
     * If true, will display recent list
     *
     * @type {boolean}
     */
    //TODO
    // RECENT_LIST_ENABLED: true,

    /**
     * Specify which sharing features should be displayed. If the value is not set
     * all sharing features will be shown. You can set [] to disable all.
     */
    // SHARING_FEATURES: ['email', 'url', 'dial-in', 'embed'],

    //TODO
    //SHOW_BRAND_WATERMARK: false,

    /**
     * Decides whether the chrome extension banner should be rendered on the landing page and during the meeting.
     * If this is set to false, the banner will not be rendered at all. If set to true, the check for extension(s)
     * being already installed is done before rendering.
     */
    /* TODO
    SHOW_CHROME_EXTENSION_BANNER: false,

    SHOW_JITSI_WATERMARK: true,
    SHOW_POWERED_BY: false,
    SHOW_PROMOTIONAL_CLOSE_PAGE: false,
    */

    /*
     * If indicated some of the error dialogs may point to the support URL for
     * help.
     */
interfaceConfig.SUPPORT_URL = 'https://fishmeet.online/support';

    // Browsers, in addition to those which do not fully support WebRTC, that
    // are not supported and should show the unsupported browser page.
    //TODO:
    //UNSUPPORTED_BROWSERS: [],

    /**
     * Whether to show thumbnails in filmstrip as a column instead of as a row.
     */
    //TODO:
    //VERTICAL_FILMSTRIP: true,

    // Determines how the video would fit the screen. 'both' would fit the whole
    // screen, 'height' would fit the original video height to the height of the
    // screen, 'width' would fit the original video width to the width of the
    // screen respecting ratio, 'nocrop' would make the video as large as
    // possible and preserve aspect ratio without cropping.
    //TODO
    //VIDEO_LAYOUT_FIT: 'both',

    /**
     * If true, hides the video quality label indicating the resolution status
     * of the current large video.
     *
     * @type {boolean}
     */
interfaceConfig.VIDEO_QUALITY_LABEL_DISABLED = true; //: false,

    /**
     * How many columns the tile view can expand to. The respected range is
     * between 1 and 5.
     */
    // TILE_VIEW_MAX_COLUMNS: 5,

    // List of undocumented settings
    /**
     INDICATOR_FONT_SIZES
     PHONE_NUMBER_REGEX
    */

    // -----------------DEPRECATED CONFIGS BELOW THIS LINE-----------------------------

    /**
     * Specify URL for downloading ios mobile app.
     */
    // MOBILE_DOWNLOAD_LINK_IOS: 'https://itunes.apple.com/us/app/jitsi-meet/id1165103905',

    /**
     * Specify custom URL for downloading android mobile app.
     */
    // MOBILE_DOWNLOAD_LINK_ANDROID: 'https://play.google.com/store/apps/details?id=org.jitsi.meet',

    /**
     * Specify mobile app scheme for opening the app from the mobile browser.
     */
    // APP_SCHEME: 'org.jitsi.meet',

    // NATIVE_APP_NAME: 'Jitsi Meet',

    /**
     * Hide the logo on the deep linking pages.
     */
interfaceConfig.HIDE_DEEP_LINKING_LOGO = true;

    /**
     * Specify the Android app package name.
     */
    // ANDROID_APP_PACKAGE: 'org.jitsi.meet',

    /**
     * Specify custom URL for downloading f droid app.
     */
    // MOBILE_DOWNLOAD_LINK_F_DROID: 'https://f-droid.org/packages/org.jitsi.meet/',

    // Connection indicators (
    // CONNECTION_INDICATOR_AUTO_HIDE_ENABLED,
    // CONNECTION_INDICATOR_AUTO_HIDE_TIMEOUT,
    // CONNECTION_INDICATOR_DISABLED) got moved to config.js.

    // Please use disableModeratorIndicator from config.js
    // DISABLE_FOCUS_INDICATOR: false,

    // Please use defaultLocalDisplayName from config.js
    // DEFAULT_LOCAL_DISPLAY_NAME: 'me',

    // Please use defaultLogoUrl from config.js
    //DEFAULT_LOGO_URL: 'images/watermark.svg',
interfaceConfig.DEFAULT_LOGO_URL = '';
interfaceConfig.JITSI_WATERMARK_LINK = ''

    // Please use defaultRemoteDisplayName from config.js
    // DEFAULT_REMOTE_DISPLAY_NAME: 'Fellow Jitster',

    // Moved to config.js as `toolbarConfig.initialTimeout`.
    // INITIAL_TOOLBAR_TIMEOUT: 20000,

    // Please use `liveStreaming.helpLink` from config.js
    // Documentation reference for the live streaming feature.
    // LIVE_STREAMING_HELP_LINK: 'https://jitsi.org/live',

    // Moved to config.js as `toolbarConfig.alwaysVisible`.
    // TOOLBAR_ALWAYS_VISIBLE: false,

    // This config was moved to config.js as `toolbarButtons`.
    // TOOLBAR_BUTTONS: [],

    // Moved to config.js as `toolbarConfig.timeout`.
    // TOOLBAR_TIMEOUT: 4000,

    // Allow all above example options to include a trailing comma and
    // prevent fear when commenting out the last value.
    // eslint-disable-next-line sort-keys
    //TODO:
    //makeJsonParserHappy: 'even if last key had a trailing comma'

    // No configuration value should follow this line.


/* eslint-enable no-unused-vars, no-var, max-len */


