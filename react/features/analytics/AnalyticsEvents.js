/**
 * The constant for the event type 'track'.
 * TODO: keep this constants in a single place. Can we import them from
 * lib-jitsi-meet's AnalyticsEvents somehow?
 * @type {string}
 */
const TYPE_TRACK = 'track';

/**
 * The constant for the event type 'UI' (User Interaction).
 * TODO: keep this constants in a single place. Can we import them from
 * lib-jitsi-meet's AnalyticsEvents somehow?
 * @type {string}
 */
const TYPE_UI = 'ui';

/**
 * The identifier for the "pinned" action. The local participant has pinned a
 * participant to remain on large video.
 *
 * @type {String}
 */
export const ACTION_PINNED = 'pinned';

/**
 * The identifier for the "unpinned" action. The local participant has unpinned
 * a participant so the participant doesn't remain permanently on local large
 * video.
 *
 * @type {String}
 */
export const ACTION_UNPINNED = 'unpinned';

/**
 * The identifier for the "pressed" action for shortcut events. This action
 * means that a button was pressed (and not yet released).
 *
 * @type {String}
 */
export const ACTION_SHORTCUT_PRESSED = 'pressed';

/**
 * The identifier for the "released" action for shortcut events. This action
 * means that a button which was previously pressed was released.
 *
 * @type {String}
 */
export const ACTION_SHORTCUT_RELEASED = 'released';

/**
 * The identifier for the "triggered" action for shortcut events. This action
 * means that a button was pressed, and we don't care about whether it was
 * released or will be released in the future.
 *
 * @type {String}
 */
export const ACTION_SHORTCUT_TRIGGERED = 'triggered';

/**
 * The name of the keyboard shortcut or toolbar button for muting audio.
 */
export const AUDIO_MUTE = 'audio.mute';

/**
 * The name of the keyboard shortcut or toolbar button for muting video.
 */
export const VIDEO_MUTE = 'video.mute';

/**
 * The login button in the profile pane was clicked.
 *
 * @type {String}
 */
export const AUTHENTICATE_LOGIN_CLICKED = 'authenticate.login.clicked';

/**
 * The logout button in the profile pane was clicked.
 *
 * @type {String}
 */
export const AUTHENTICATE_LOGOUT_CLICKED = 'authenticate.logout.clicked';

/**
 * The feedback dialog is displayed.
 *
 * @type {String}
 */
export const FEEDBACK_OPEN = 'feedback.open';

/**
 * Page reload overlay has been displayed.
 *
 * Properties: label: reason for reload
 *
 * @type {String}
 */
export const PAGE_RELOAD = 'page.reload';

/**
 * Recording start was attempted but the local user canceled the request.
 *
 * @type {String}
 */
export const RECORDING_CANCELED = 'recording.canceled';

/**
 * Recording button has been clicked.
 *
 * @type {String}
 */
export const RECORDING_CLICKED = 'recording.clicked';

/**
 * Recording has been started.
 *
 * @type {String}
 */
export const RECORDING_STARTED = 'recording.started';

/**
 * Recording has been stopped by clicking the recording button.
 *
 * @type {String}
 */
export const RECORDING_STOPPED = 'recording.stopped';

/**
 * Clicked on the button to kick a remote participant from the conference.
 *
 * Properties: value: 1, label: participantID
 *
 * @type {String}
 */
export const REMOTE_VIDEO_MENU_KICK = 'remotevideomenu.kick';

/**
 * Clicked on the button to audio mute a remote participant.
 *
 * Properties: value: 1, label: participantID
 *
 * @type {String}
 */
export const REMOTE_VIDEO_MENU_MUTE_CLICKED = 'remotevideomenu.mute.clicked';

/**
 * Confirmed the muting of a remote participant.
 *
 * Properties: value: 1, label: participantID
 *
 * @type {String}
 */
export const REMOTE_VIDEO_MENU_MUTE_CONFIRMED
    = 'remotevideomenu.mute.confirmed';

/**
 * Clicked on the remote control option in the remote menu.
 *
 * Properties: value: 1, label: participantID
 *
 * Known full event names:
 * remotevideomenu.remotecontrol.stop
 * remotevideomenu.remotecontrol.start
 *
 * @type {String}
 */
export const REMOTE_VIDEO_MENU_REMOTE_CONTROL_
    = 'remotevideomenu.remotecontrol';

/**
 * Creates an event which indicates that a certain action was requested through
 * the jitsi-meet API.
 *
 * @param {Object} action - The action which was requested through the
 * jitsi-meet API.
 * @param {Object} attributes - Attributes to attach to the event.
 * @returns {Object} The event in a format suitable for sending via
 *      sendAnalytics.
 */
export const createApiEvent = function(action, attributes = {}) {
    return {
        action,
        attributes,
        source: 'jitsi-meet-api'
    };
};

/**
 * Creates an event which indicates that the audio-only mode has been turned
 * off.
 *
 * @returns {Object} The event in a format suitable for sending via
 *      sendAnalytics.
 */
export const createAudioOnlyDisableEvent = function() {
    return {
        name: 'audio.only.disabled'
    };
};

/**
 * Creates an event which indicates that a device was changed.
 *
 * @param {string} mediaType - The media type of the device ('audio' or
 * 'video').
 * @param {string} deviceType - The type of the device ('input' or 'output').
 * @returns {Object} The event in a format suitable for sending via
 *      sendAnalytics.
 */
export const createDeviceChangedEvent = function(mediaType, deviceType) {
    return {
        name: 'device.changed',
        attributes: {
            deviceType,
            mediaType
        }
    };
};


/**
 * Creates a "filmstrip toggled" event.
 *
 * @param {Object} attributes - Attributes to attach to the event.
 * @returns {Object} The event in a format suitable for sending via
 *      sendAnalytics.
 */
export const createFilmstripToggledEvent = function(attributes) {
    return {
        attributes,
        name: 'filmstrip.toggled'
    };
};

/**
 * Creates a "page reload" event.
 *
 * @param {string} reason - The reason for the reload.
 * @param {number} timeout - The timeout in seconds after which the page is
 * scheduled to reload.
 * @returns {Object} The event in a format suitable for sending via
 *      sendAnalytics.
 */
export const createPageReloadScheduledEvent = function(reason, timeout) {
    return {
        attributes: {
            reason,
            timeout
        },
        name: 'page.reload.scheduled'
    };
};

/**
 * Creates a "pinned" or "unpinned" event.
 *
 * @param {string} action - The action ("pinned" or "unpinned").
 * @param {string} participantId - The ID of the participant which was pinned.
 * @param {Object} attributes - Attributes to attach to the event.
 * @returns {Object} The event in a format suitable for sending via
 *      sendAnalytics.
 */
export const createPinnedEvent
        = function(action, participantId, attributes) {
            return {
                type: TYPE_TRACK,
                action,
                actionSubject: 'participant',
                objectType: 'participant',
                objectId: participantId,
                attributes
            };
        };

/**
 * Creates an event indicating that an action related to screen sharing
 * occurred (e.g. it was started or stopped).
 *
 * @param {Object} action - The action which occurred.
 * @returns {Object} The event in a format suitable for sending via
 *      sendAnalytics.
 */
export const createScreenSharingEvent = function(action) {
    return {
        action,
        actionSubject: 'screen.sharing'
    };
};

/**
 * The local participant failed to send a "selected endpoint" message to the
 * bridge.
 *
 * @param {Error} error - The error which caused the failure.
 * @returns {Object} The event in a format suitable for sending via
 *      sendAnalytics.
 */
export const createSelectParticipantFailedEvent = function(error) {
    const event = {
        name: 'select.participant.failed'
    };

    if (error) {
        event.error = error.toString();
    }

    return event;
};

/**
 * Creates an event associated with the "shared video" feature.
 *
 * @param {string} action - The action that the event represents.
 * @param {Object} attributes - Attributes to attach to the event.
 * @returns {Object} The event in a format suitable for sending via
 *      sendAnalytics.
 */
export const createSharedVideoEvent = function(action, attributes = {}) {
    return {
        action,
        attributes,
        actionSubject: 'shared.video'
    };
};

/**
 * Creates an event associated with a shortcut being pressed, released or
 * triggered. By convention, where appropriate an attribute named 'enable'
 * should be used to indicate the action which resulted by the shortcut being
 * pressed (e.g. whether screen sharing was enabled or disabled).
 *
 * @param {string} action - The action that the event represents (one
 * of ACTION_SHORTCUT_PRESSED, ACTION_SHORTCUT_RELEASED
 * or ACTION_SHORTCUT_TRIGGERED).
 * @param {string} shortcut - The identifier of the shortcut which produced
 * an action.
 * @param {Object} attributes - Attributes to attach to the event.
 * @returns {Object} The event in a format suitable for sending via
 *      sendAnalytics.
 */
export const createShortcutEvent
    = function(action, shortcut, attributes = {}) {
        return {
            action,
            actionSubject: 'keyboard.shortcut',
            actionSubjectId: shortcut,
            attributes,
            source: 'keyboard.shortcut',
            type: TYPE_UI
        };
    };

/**
 * Creates an event associated with a toolbar button being clicked/pressed. By
 * convention, where appropriate an attribute named 'enable' should be used to
 * indicate the action which resulted by the shortcut being pressed (e.g.
 * whether screen sharing was enabled or disabled).
 *
 * @param {string} buttonName - The identifier of the toolbar button which was
 * clicked/pressed.
 * @param {Object} attributes - Attributes to attach to the event.
 * @returns {Object} The event in a format suitable for sending via
 *      sendAnalytics.
 */
export const createToolbarEvent = function(buttonName, attributes = {}) {
    return {
        action: 'clicked',
        actionSubject: 'toolbar.button',
        actionSubjectId: buttonName,
        attributes,
        source: 'toolbar.button',
        type: TYPE_UI
    };
};

/**
 * Creates an event which indicates the "start audio only" configuration.
 *
 * @param {boolean} audioOnly - Whether "start audio only" is enabled or not.
 * @returns {Object} The event in a format suitable for sending via
 *      sendAnalytics.
 */
export const createStartAudioOnlyEvent = function(audioOnly) {
    return {
        name: 'start.audio.only',
        attributes: {
            'enabled': audioOnly
        }
    };
};

/**
 * Creates an event which indicates the "start muted" configuration.
 *
 * @param {string} source - The source of the configuration, 'local' or
 * 'remote' depending on whether it comes from the static configuration (i.e.
 * config.js) or comes dynamically from Jicofo.
 * @param {boolean} audioMute - Whether the configuration requests that audio
 * is muted.
 * @param {boolean} videoMute - Whether the configuration requests that video
 * is muted.
 * @returns {Object} The event in a format suitable for sending via
 *      sendAnalytics.
 */
export const createStartMutedConfigurationEvent
    = function(source, audioMute, videoMute) {
        return {
            name: 'start.muted.configuration',
            attributes: {
                source,
                audioMute,
                videoMute
            }
        };
    };

/**
 * Creates an event which indicates that the invite dialog was closed. This is
 * not a UI, since it is not necessarily the result of a user interaction.
 *
 * @returns {{name: string}}
 */
export const createInviteDialogClosedEvent = function() {
    return {
        name: 'invite.dialog.closed'
    };
};

/**
 * Creates an event which indicates the delay for switching between simulcast
 * streams.
 *
 * @param {Object} attributes - Attributes to attach to the event.
 * @returns {Object} The event in a format suitable for sending via
 *      sendAnalytics.
 */
export const createStreamSwitchDelayEvent = function(attributes) {
    return {
        name: 'stream.switch.delay',
        attributes
    };
};

/**
 * Automatically changing the mute state of a media track in order to match
 * the current stored state in redux.
 *
 * @param {string} mediaType - The track's media type ('audio' or 'video').
 * @param {boolean} muted - Whether the track is being muted or unmuted as
 * as result of the sync operation.
 * @returns {Object} The event in a format suitable for sending via
 *      sendAnalytics.
 */
export const createSyncTrackStateEvent = function(mediaType, muted) {
    return {
        name: 'sync.track.state',
        attributes: {
            mediaType,
            muted
        }
    };
};

/**
 * Creates an event which indicates that a local track was muted because of the
 * "initially muted" configuration.
 *
 * @param {string} mediaType - The track's media type ('audio' or 'video').
 * @param {string} reason - The reason the track was muted (e.g. it was
 * triggered by the "initial mute" option, or a previously muted track was
 * replaced (e.g. when a new device was used)).
 * @param {boolean} muted - Whether the track was muted or unmuted.
 * @returns {Object} The event in a format suitable for sending via
 *      sendAnalytics.
 */
export const createTrackMutedEvent = function(mediaType, reason, muted = true) {
    return {
        name: 'track.muted',
        attributes: {
            mediaType,
            muted,
            reason
        }
    };
};
