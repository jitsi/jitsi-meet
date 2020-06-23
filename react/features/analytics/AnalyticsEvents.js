/**
 * The constant for the event type 'track'.
 * TODO: keep these constants in a single place. Can we import them from
 * lib-jitsi-meet's AnalyticsEvents somehow?
 * @type {string}
 */
const TYPE_TRACK = 'track';

/**
 * The constant for the event type 'UI' (User Interaction).
 * TODO: keep these constants in a single place. Can we import them from
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
 * Creates an event which indicates that a certain action was requested through
 * the jitsi-meet API.
 *
 * @param {Object} action - The action which was requested through the
 * jitsi-meet API.
 * @param {Object} attributes - Attributes to attach to the event.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createApiEvent(action, attributes = {}) {
    return {
        action,
        attributes,
        source: 'jitsi-meet-api'
    };
}

/**
 * Creates an event which indicates that the audio-only mode has been changed.
 *
 * @param {boolean} enabled - True if audio-only is enabled, false otherwise.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createAudioOnlyChangedEvent(enabled) {
    return {
        action: `audio.only.${enabled ? 'enabled' : 'disabled'}`
    };
}

/**
 * Creates an event for about the JitsiConnection.
 *
 * @param {string} action - The action that the event represents.
 * @param {boolean} attributes - Additional attributes to attach to the event.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createConnectionEvent(action, attributes = {}) {
    return {
        action,
        actionSubject: 'connection',
        attributes
    };
}

/**
 * Creates an event which indicates an action occurred in the calendar
 * integration UI.
 *
 * @param {string} eventName - The name of the calendar UI event.
 * @param {Object} attributes - Attributes to attach to the event.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createCalendarClickedEvent(eventName, attributes = {}) {
    return {
        action: 'clicked',
        actionSubject: eventName,
        attributes,
        source: 'calendar',
        type: TYPE_UI
    };
}

/**
 * Creates an event which indicates that the calendar container is shown and
 * selected.
 *
 * @param {Object} attributes - Attributes to attach to the event.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createCalendarSelectedEvent(attributes = {}) {
    return {
        action: 'selected',
        actionSubject: 'calendar.selected',
        attributes,
        source: 'calendar',
        type: TYPE_UI
    };
}

/**
 * Creates an event indicating that a calendar has been connected.
 *
 * @param {boolean} attributes - Additional attributes to attach to the event.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createCalendarConnectedEvent(attributes = {}) {
    return {
        action: 'calendar.connected',
        actionSubject: 'calendar.connected',
        attributes
    };
}

/**
 * Creates an event which indicates an action occurred in the recent list
 * integration UI.
 *
 * @param {string} eventName - The name of the recent list UI event.
 * @param {Object} attributes - Attributes to attach to the event.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createRecentClickedEvent(eventName, attributes = {}) {
    return {
        action: 'clicked',
        actionSubject: eventName,
        attributes,
        source: 'recent.list',
        type: TYPE_UI
    };
}

/**
 * Creates an event which indicate an action occured in the chrome extension banner.
 *
 * @param {boolean} installPressed - Whether the user pressed install or `x` - cancel.
 * @param {Object} attributes - Attributes to attach to the event.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createChromeExtensionBannerEvent(installPressed, attributes = {}) {
    return {
        action: installPressed ? 'install' : 'cancel',
        attributes,
        source: 'chrome.extension.banner',
        type: TYPE_UI
    };
}

/**
 * Creates an event which indicates that the recent list container is shown and
 * selected.
 *
 * @param {Object} attributes - Attributes to attach to the event.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createRecentSelectedEvent(attributes = {}) {
    return {
        action: 'selected',
        actionSubject: 'recent.list.selected',
        attributes,
        source: 'recent.list',
        type: TYPE_UI
    };
}

/**
 * Creates an event for an action on the deep linking page.
 *
 * @param {string} action - The action that the event represents.
 * @param {string} actionSubject - The subject that was acted upon.
 * @param {boolean} attributes - Additional attributes to attach to the event.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createDeepLinkingPageEvent(
        action, actionSubject, attributes = {}) {
    return {
        action,
        actionSubject,
        source: 'deepLinkingPage',
        attributes
    };
}

/**
 * Creates an event which indicates that a device was changed.
 *
 * @param {string} mediaType - The media type of the device ('audio' or
 * 'video').
 * @param {string} deviceType - The type of the device ('input' or 'output').
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createDeviceChangedEvent(mediaType, deviceType) {
    return {
        action: 'device.changed',
        attributes: {
            'device_type': deviceType,
            'media_type': mediaType
        }
    };
}

/**
 * Creates an event indicating that an action related to E2EE occurred.
 *
 * @param {string} action - The action which occurred.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createE2EEEvent(action) {
    return {
        action,
        actionSubject: 'e2ee'
    };
}

/**
 * Creates an event which specifies that the feedback dialog has been opened.
 *
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createFeedbackOpenEvent() {
    return {
        action: 'feedback.opened'
    };
}

/**
 * Creates an event for an action regarding the AddPeopleDialog (invites).
 *
 * @param {string} action - The action that the event represents.
 * @param {string} actionSubject - The subject that was acted upon.
 * @param {boolean} attributes - Additional attributes to attach to the event.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createInviteDialogEvent(
        action, actionSubject, attributes = {}) {
    return {
        action,
        actionSubject,
        attributes,
        source: 'inviteDialog'
    };
}

/**
 * Creates an event which reports about the current network information reported by the operating system.
 *
 * @param {boolean} isOnline - Tells whether or not the internet is reachable.
 * @param {string} [networkType] - Network type, see {@code NetworkInfo} type defined by the 'base/net-info' feature.
 * @param {Object} [details] - Extra info, see {@code NetworkInfo} type defined by the 'base/net-info' feature.
 * @returns {Object}
 */
export function createNetworkInfoEvent({ isOnline, networkType, details }) {
    const attributes = { isOnline };

    // Do no include optional stuff or Amplitude handler will log warnings.
    networkType && (attributes.networkType = networkType);
    details && (attributes.details = details);

    return {
        action: 'network.info',
        attributes
    };
}

/**
 * Creates an "offer/answer failure" event.
 *
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createOfferAnswerFailedEvent() {
    return {
        action: 'offer.answer.failure'
    };
}

/**
 * Creates a "page reload" event.
 *
 * @param {string} reason - The reason for the reload.
 * @param {number} timeout - The timeout in seconds after which the page is
 * scheduled to reload.
 * @param {Object} details - The details for the error.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createPageReloadScheduledEvent(reason, timeout, details) {
    return {
        action: 'page.reload.scheduled',
        attributes: {
            reason,
            timeout,
            ...details
        }
    };
}

/**
 * Creates a "pinned" or "unpinned" event.
 *
 * @param {string} action - The action ("pinned" or "unpinned").
 * @param {string} participantId - The ID of the participant which was pinned.
 * @param {Object} attributes - Attributes to attach to the event.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createPinnedEvent(action, participantId, attributes) {
    return {
        type: TYPE_TRACK,
        action,
        actionSubject: 'participant',
        objectType: 'participant',
        objectId: participantId,
        attributes
    };
}

/**
 * Creates an event which indicates that a button in the profile panel was
 * clicked.
 *
 * @param {string} buttonName - The name of the button.
 * @param {Object} attributes - Attributes to attach to the event.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createProfilePanelButtonEvent(buttonName, attributes = {}) {
    return {
        action: 'clicked',
        actionSubject: buttonName,
        attributes,
        source: 'profile.panel',
        type: TYPE_UI
    };
}

/**
 * Creates an event which indicates that a specific button on one of the
 * recording-related dialogs was clicked.
 *
 * @param {string} dialogName - The name of the dialog (e.g. 'start' or 'stop').
 * @param {string} buttonName - The name of the button (e.g. 'confirm' or
 * 'cancel').
 * @param {Object} attributes - Attributes to attach to the event.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createRecordingDialogEvent(
        dialogName, buttonName, attributes = {}) {
    return {
        action: 'clicked',
        actionSubject: buttonName,
        attributes,
        source: `${dialogName}.recording.dialog`,
        type: TYPE_UI
    };
}

/**
 * Creates an event which indicates that a specific button on one of the
 * liveStreaming-related dialogs was clicked.
 *
 * @param {string} dialogName - The name of the dialog (e.g. 'start' or 'stop').
 * @param {string} buttonName - The name of the button (e.g. 'confirm' or
 * 'cancel').
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createLiveStreamingDialogEvent(dialogName, buttonName) {
    return {
        action: 'clicked',
        actionSubject: buttonName,
        source: `${dialogName}.liveStreaming.dialog`,
        type: TYPE_UI
    };
}

/**
 * Creates an event with the local tracks duration.
 *
 * @param {Object} duration - The object with the duration of the local tracks.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createLocalTracksDurationEvent(duration) {
    const { audio, video, conference } = duration;
    const { camera, desktop } = video;

    return {
        action: 'local.tracks.durations',
        attributes: {
            audio: audio.value,
            camera: camera.value,
            conference: conference.value,
            desktop: desktop.value
        }
    };
}

/**
 * Creates an event which indicates that an action related to recording has
 * occured.
 *
 * @param {string} action - The action (e.g. 'start' or 'stop').
 * @param {string} type - The recording type (e.g. 'file' or 'live').
 * @param {number} value - The duration of the recording in seconds (for stop
 * action).
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createRecordingEvent(action, type, value) {
    return {
        action,
        actionSubject: `recording.${type}`,
        attributes: {
            value
        }
    };
}

/**
 * Creates an event which indicates that the same conference has been rejoined.
 *
 * @param {string} url - The full conference URL.
 * @param {number} lastConferenceDuration - How many seconds user stayed in the previous conference.
 * @param {number} timeSinceLeft - How many seconds since the last conference was left.
 * @returns {Object} The event in a format suitable for sending via sendAnalytics.
 */
export function createRejoinedEvent({ url, lastConferenceDuration, timeSinceLeft }) {
    return {
        action: 'rejoined',
        attributes: {
            lastConferenceDuration,
            timeSinceLeft,
            url
        }
    };
}

/**
 * Creates an event which specifies that the "confirm" button on the remote
 * mute dialog has been clicked.
 *
 * @param {string} participantId - The ID of the participant that was remotely
 * muted.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createRemoteMuteConfirmedEvent(participantId) {
    return {
        action: 'clicked',
        actionSubject: 'remote.mute.dialog.confirm.button',
        attributes: {
            'participant_id': participantId
        },
        source: 'remote.mute.dialog',
        type: TYPE_UI
    };
}

/**
 * Creates an event which indicates that one of the buttons in the "remote
 * video menu" was clicked.
 *
 * @param {string} buttonName - The name of the button.
 * @param {Object} attributes - Attributes to attach to the event.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createRemoteVideoMenuButtonEvent(buttonName, attributes) {
    return {
        action: 'clicked',
        actionSubject: buttonName,
        attributes,
        source: 'remote.video.menu',
        type: TYPE_UI
    };
}

/**
 * Creates an event indicating that an action related to video blur
 * occurred (e.g. It was started or stopped).
 *
 * @param {string} action - The action which occurred.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createVideoBlurEvent(action) {
    return {
        action,
        actionSubject: 'video.blur'
    };
}

/**
 * Creates an event indicating that an action related to screen sharing
 * occurred (e.g. It was started or stopped).
 *
 * @param {string} action - The action which occurred.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createScreenSharingEvent(action) {
    return {
        action,
        actionSubject: 'screen.sharing'
    };
}

/**
 * The local participant failed to send a "selected endpoint" message to the
 * bridge.
 *
 * @param {Error} error - The error which caused the failure.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createSelectParticipantFailedEvent(error) {
    const event = {
        action: 'select.participant.failed'
    };

    if (error) {
        event.error = error.toString();
    }

    return event;
}

/**
 * Creates an event associated with the "shared video" feature.
 *
 * @param {string} action - The action that the event represents.
 * @param {Object} attributes - Attributes to attach to the event.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createSharedVideoEvent(action, attributes = {}) {
    return {
        action,
        attributes,
        actionSubject: 'shared.video'
    };
}

/**
 * Creates an event associated with a shortcut being pressed, released or
 * triggered. By convention, where appropriate an attribute named 'enable'
 * should be used to indicate the action which resulted by the shortcut being
 * pressed (e.g. Whether screen sharing was enabled or disabled).
 *
 * @param {string} shortcut - The identifier of the shortcut which produced
 * an action.
 * @param {string} action - The action that the event represents (one
 * of ACTION_SHORTCUT_PRESSED, ACTION_SHORTCUT_RELEASED
 * or ACTION_SHORTCUT_TRIGGERED).
 * @param {Object} attributes - Attributes to attach to the event.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createShortcutEvent(
        shortcut,
        action = ACTION_SHORTCUT_TRIGGERED,
        attributes = {}) {
    return {
        action,
        actionSubject: 'keyboard.shortcut',
        actionSubjectId: shortcut,
        attributes,
        source: 'keyboard.shortcut',
        type: TYPE_UI
    };
}

/**
 * Creates an event which indicates the "start audio only" configuration.
 *
 * @param {boolean} audioOnly - Whether "start audio only" is enabled or not.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createStartAudioOnlyEvent(audioOnly) {
    return {
        action: 'start.audio.only',
        attributes: {
            enabled: audioOnly
        }
    };
}

/**
 * Creates an event which indicates the "start silent" configuration.
 *
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createStartSilentEvent() {
    return {
        action: 'start.silent'
    };
}

/**
 * Creates an event which indicates the "start muted" configuration.
 *
 * @param {string} source - The source of the configuration, 'local' or
 * 'remote' depending on whether it comes from the static configuration (i.e.
 * {@code config.js}) or comes dynamically from Jicofo.
 * @param {boolean} audioMute - Whether the configuration requests that audio
 * is muted.
 * @param {boolean} videoMute - Whether the configuration requests that video
 * is muted.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createStartMutedConfigurationEvent(
        source,
        audioMute,
        videoMute) {
    return {
        action: 'start.muted.configuration',
        attributes: {
            source,
            'audio_mute': audioMute,
            'video_mute': videoMute
        }
    };
}

/**
 * Automatically changing the mute state of a media track in order to match
 * the current stored state in redux.
 *
 * @param {string} mediaType - The track's media type ('audio' or 'video').
 * @param {boolean} muted - Whether the track is being muted or unmuted as
 * as result of the sync operation.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createSyncTrackStateEvent(mediaType, muted) {
    return {
        action: 'sync.track.state',
        attributes: {
            'media_type': mediaType,
            muted
        }
    };
}

/**
 * Creates an event associated with a toolbar button being clicked/pressed. By
 * convention, where appropriate an attribute named 'enable' should be used to
 * indicate the action which resulted by the shortcut being pressed (e.g.
 * Whether screen sharing was enabled or disabled).
 *
 * @param {string} buttonName - The identifier of the toolbar button which was
 * clicked/pressed.
 * @param {Object} attributes - Attributes to attach to the event.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createToolbarEvent(buttonName, attributes = {}) {
    return {
        action: 'clicked',
        actionSubject: buttonName,
        attributes,
        source: 'toolbar.button',
        type: TYPE_UI
    };
}

/**
 * Creates an event which indicates that a local track was muted.
 *
 * @param {string} mediaType - The track's media type ('audio' or 'video').
 * @param {string} reason - The reason the track was muted (e.g. It was
 * triggered by the "initial mute" option, or a previously muted track was
 * replaced (e.g. When a new device was used)).
 * @param {boolean} muted - Whether the track was muted or unmuted.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createTrackMutedEvent(mediaType, reason, muted = true) {
    return {
        action: 'track.muted',
        attributes: {
            'media_type': mediaType,
            muted,
            reason
        }
    };
}

/**
 * Creates an event for an action on the welcome page.
 *
 * @param {string} action - The action that the event represents.
 * @param {string} actionSubject - The subject that was acted upon.
 * @param {boolean} attributes - Additional attributes to attach to the event.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createWelcomePageEvent(action, actionSubject, attributes = {}) {
    return {
        action,
        actionSubject,
        attributes,
        source: 'welcomePage'
    };
}
