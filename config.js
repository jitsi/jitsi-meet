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
    hosts: {
        domain: 'jitsi-meet.example.com',
        muc: 'conference.' + subdomain + 'jitsi-meet.example.com',
    },
    bosh: 'https://jitsi-meet.example.com/' + subdir + 'http-bind',

    // Testing / experimental features
    testing: {
        assumeBandwidth: true,
    },

    // Media
    enableNoAudioDetection: true,
    enableNoisyMicDetection: true,

    // Whiteboard configuration
    whiteboard: {
        enabled: true, // Enable the whiteboard
        collabServerBaseUrl: 'https://excalidraw-backend.example.com', // Replace with your Excalidraw backend URL
        userLimit: 25, // Limit the number of users who can use the whiteboard simultaneously
    },

    // Grant moderator rights to all participants
    startWithAudioMuted: false, // Allow participants to start with audio unmuted
    startWithVideoMuted: false, // Allow participants to start with video unmuted
    enableUserRolesBasedOnToken: false, // Disable token-based roles
    disableModeratorIndicator: true, // Hide the moderator indicator
    defaultRemoteDisplayName: 'Fellow Jitster', // Default name for remote participants
    defaultLocalDisplayName: 'me', // Default name for local participant
    enableFeaturesBasedOnToken: false, // Disable token-based feature restrictions
    disableProfile: false, // Allow profile editing
    requireDisplayName: false, // Do not require display names
    enableWelcomePage: false, // Disable the welcome page
    prejoinPageEnabled: false, // Disable the prejoin page
    enableClosePage: false, // Disable the close page
    disable1On1Mode: true, // Disable 1:1 mode
    disableDeepLinking: true, // Disable deep linking
    disableInviteFunctions: true, // Disable invite functions
    disableRemoteControl: true, // Disable remote control
    disableSimulcast: true, // Disable simulcast
    disableThirdPartyRequests: true, // Disable third-party requests
    disableNotifications: true, // Disable all notifications
    disableSounds: true, // Disable all sounds
    disableReactions: true, // Disable reactions
    disablePolls: true, // Disable polls
    disableReactionsModeration: true, // Disable reactions moderation
    disableReactionsNotifications: true, // Disable reactions notifications

    // Toolbar buttons
    toolbarButtons: ['microphone', 'camera', 'chat', 'raisehand', 'participants-pane', 'select-background', 'whiteboard', 'hangup'],

    // Interface configuration
    interfaceConfigOverwrite: {
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true, // Disable join/leave notifications
        SHOW_JITSI_WATERMARK: false, // Hide Jitsi watermark
        SHOW_WATERMARK_FOR_GUESTS: false, // Hide watermark for guests
        TOOLBAR_BUTTONS: ['microphone', 'camera', 'chat', 'raisehand', 'participants-pane', 'select-background', 'whiteboard', 'hangup'], // Toolbar buttons
        DISABLE_RINGING: true, // Disable ringing notifications
        DISABLE_VIDEO_BACKGROUND: true, // Disable video background notifications
        DISABLE_FOCUS_INDICATOR: true, // Disable focus indicator notifications
        DISABLE_DOMINANT_SPEAKER_INDICATOR: true, // Disable dominant speaker notifications
        DISABLE_PRESENCE_STATUS: true, // Disable presence status notifications
        DISABLE_RECORDING_NOTIFICATIONS: true, // Disable recording notifications
        DISABLE_TRANSCRIPTION_SUBTITLES: true, // Disable transcription subtitles
    },

    // Misc
    channelLastN: -1,

    // P2P mode
    p2p: {
        enabled: true,
        stunServers: [
            { urls: 'stun:meet-jit-si-turnrelay.jitsi.net:443' },
        ],
    },

    // Analytics
    analytics: {
        disabled: false,
    },

    // Logging
    logging: {
        defaultLogLevel: 'trace',
    },

    // Application logo URL
    defaultLogoUrl: 'images/watermark.svg',

    // WatchRTC configuration
    watchRTCConfigParams: {
        rtcApiKey: 'your-api-key',
    },

    // Hide login button on auth dialog
    hideLoginButton: true,

    // Disable camera tint foreground
    disableCameraTintForeground: false,
};

// Set the default values for JaaS customers
if (enableJaaS) {
    config.dialInNumbersUrl = 'https://conference-mapper.jitsi.net/v1/access/dids';
    config.dialInConfCodeUrl = 'https://conference-mapper.jitsi.net/v1/access';
    config.roomPasswordNumberOfDigits = 10; // Skip re-adding it (do not remove comment)
}
