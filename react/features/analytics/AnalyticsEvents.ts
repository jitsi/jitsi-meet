/**
 * The constant for the event type 'track'.
 * TODO: keep these constants in a single place. Can we import them from
 * lib-jitsi-meet's AnalyticsEvents somehow?
 *
 * @type {string}
 */
const TYPE_TRACK = 'track';

/**
 * The constant for the event type 'UI' (User Interaction).
 * TODO: keep these constants in a single place. Can we import them from
 * lib-jitsi-meet's AnalyticsEvents somehow?
 *
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
 * @param {string} action - The action which was requested through the
 * jitsi-meet API.
 * @param {Object} attributes - Attributes to attach to the event.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createApiEvent(action: string, attributes = {}) {
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
export function createAudioOnlyChangedEvent(enabled: boolean) {
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
export function createConnectionEvent(action: string, attributes = {}) {
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
export function createCalendarClickedEvent(eventName: string, attributes = {}) {
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
        action: 'connected',
        actionSubject: 'calendar',
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
export function createRecentClickedEvent(eventName: string, attributes = {}) {
    return {
        action: 'clicked',
        actionSubject: eventName,
        attributes,
        source: 'recent.list',
        type: TYPE_UI
    };
}

/**
 * Creates an event which indicate an action occurred in the chrome extension banner.
 *
 * @param {boolean} installPressed - Whether the user pressed install or `x` - cancel.
 * @param {Object} attributes - Attributes to attach to the event.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createChromeExtensionBannerEvent(installPressed: boolean, attributes = {}) {
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
        action: string, actionSubject: string, attributes = {}) {
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
export function createDeviceChangedEvent(mediaType: string, deviceType: string) {
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
export function createE2EEEvent(action: string) {
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
        action: string, actionSubject: string, attributes = {}) {
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
export function createNetworkInfoEvent({ isOnline, networkType, details }:
{ details?: Object; isOnline: boolean; networkType?: string; }) {
    const attributes: {
        details?: Object;
        isOnline: boolean;
        networkType?: string;
    } = { isOnline };

    // Do no include optional stuff or Amplitude handler will log warnings.
    networkType && (attributes.networkType = networkType);
    details && (attributes.details = details);

    return {
        action: 'network.info',
        attributes
    };
}

/**
 * Creates a "not allowed error" event.
 *
 * @param {string} type - The type of the error.
 * @param {string} reason - The reason for the error.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createNotAllowedErrorEvent(type: string, reason: string) {
    return {
        action: 'not.allowed.error',
        attributes: {
            reason,
            type
        }
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
export function createPageReloadScheduledEvent(reason: string, timeout: number, details: Object = {}) {
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
export function createPinnedEvent(action: string, participantId: string, attributes = {}) {
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
 * Creates a poll event.
 * The following events will be created:
 * - poll.created
 * - poll.vote.checked
 * - poll.vote.sent
 * - poll.vote.skipped
 * - poll.vote.detailsViewed
 * - poll.vote.changed
 * - poll.option.added
 * - poll.option.moved
 * - poll.option.removed.
 *
 * @param {string} action - The action.
 * @returns {Object}
 */
export function createPollEvent(action: string) {
    return {
        action: `poll.${action}`
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
export function createProfilePanelButtonEvent(buttonName: string, attributes = {}) {
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
        dialogName: string, buttonName: string, attributes = {}) {
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
export function createLiveStreamingDialogEvent(dialogName: string, buttonName: string) {
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
export function createLocalTracksDurationEvent(duration: {
    audio: { value: number; };
    conference: { value: number; };
    video: {
        camera: { value: number; };
        desktop: { value: number; };
    };
}) {
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
 * occurred.
 *
 * @param {string} action - The action (e.g. 'start' or 'stop').
 * @param {string} type - The recording type (e.g. 'file' or 'live').
 * @param {number} value - The duration of the recording in seconds (for stop
 * action).
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createRecordingEvent(action: string, type: string, value?: number) {
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
export function createRejoinedEvent({ url, lastConferenceDuration, timeSinceLeft }: {
    lastConferenceDuration: number;
    timeSinceLeft: number;
    url: string;
}) {
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
 * @param {string} mediaType - The media type of the channel to mute.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createRemoteMuteConfirmedEvent(participantId: string, mediaType: string) {
    return {
        action: 'clicked',
        attributes: {
            'participant_id': participantId,
            'media_type': mediaType
        },
        source: 'remote.mute.button',
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
export function createRemoteVideoMenuButtonEvent(buttonName: string, attributes = {}) {
    return {
        action: 'clicked',
        actionSubject: buttonName,
        attributes,
        source: 'remote.video.menu',
        type: TYPE_UI
    };
}

/**
 * The rtcstats websocket onclose event. We send this to amplitude in order
 * to detect trace ws prematurely closing.
 *
 * @param {Object} closeEvent - The event with which the websocket closed.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createRTCStatsTraceCloseEvent(closeEvent: { code: string; reason: string; }) {
    const event: {
        action: string;
        code?: string;
        reason?: string;
        source: string;
    } = {
        action: 'trace.onclose',
        source: 'rtcstats'
    };

    event.code = closeEvent.code;
    event.reason = closeEvent.reason;

    return event;
}

/**
 * Creates an event indicating that an action related to screen sharing
 * occurred (e.g. It was started or stopped).
 *
 * @param {string} action - The action which occurred.
 * @param {number?} value - The screenshare duration in seconds.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createScreenSharingEvent(action: string, value = null) {
    return {
        action,
        actionSubject: 'screen.sharing',
        attributes: {
            value
        }
    };
}

/**
 * Creates an event which indicates the screen sharing video is not displayed when it needs to be displayed.
 *
 * @param {Object} attributes - Additional information that describes the issue.
 * @returns {Object} The event in a format suitable for sending via sendAnalytics.
 */
export function createScreenSharingIssueEvent(attributes = {}) {
    return {
        action: 'screen.sharing.issue',
        attributes
    };
}

/**
 * Creates an event associated with the "shared video" feature.
 *
 * @param {string} action - The action that the event represents.
 * @param {Object} attributes - Attributes to attach to the event.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createSharedVideoEvent(action: string, attributes = {}) {
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
 * @param {string} source - The event's source.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createShortcutEvent(
        shortcut: string,
        action = ACTION_SHORTCUT_TRIGGERED,
        attributes = {},
        source = 'keyboard.shortcut') {
    return {
        action,
        actionSubjectId: shortcut,
        attributes,
        source,
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
export function createStartAudioOnlyEvent(audioOnly: boolean) {
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
 * Creates an event which indicates that HTMLAudioElement.play has failed.
 *
 * @param {string} elementID - The ID of the HTMLAudioElement.
 * @returns {Object} The event in a format suitable for sending via sendAnalytics.
 */
export function createAudioPlayErrorEvent(elementID: string) {
    return {
        action: 'audio.play.error',
        attributes: {
            elementID
        }
    };
}

/**
 * Creates an event which indicates that HTMLAudioElement.play has succeeded after a prior failure.
 *
 * @param {string} elementID - The ID of the HTMLAudioElement.
 * @returns {Object} The event in a format suitable for sending via sendAnalytics.
 */
export function createAudioPlaySuccessEvent(elementID: string) {
    return {
        action: 'audio.play.success',
        attributes: {
            elementID
        }
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
        source: string,
        audioMute: boolean,
        videoMute: boolean) {
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
export function createSyncTrackStateEvent(mediaType: string, muted: boolean) {
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
export function createToolbarEvent(buttonName: string, attributes = {}) {
    return {
        action: 'clicked',
        actionSubject: buttonName,
        attributes,
        source: 'toolbar.button',
        type: TYPE_UI
    };
}

/**
 * Creates an event associated with a reaction button being clicked/pressed.
 *
 * @param {string} buttonName - The identifier of the reaction button which was
 * clicked/pressed.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createReactionMenuEvent(buttonName: string) {
    return {
        action: 'clicked',
        actionSubject: 'button',
        source: 'reaction',
        buttonName,
        type: TYPE_UI
    };
}

/**
 * Creates an event associated with disabling of reaction sounds.
 *
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createReactionSoundsDisabledEvent() {
    return {
        action: 'disabled',
        actionSubject: 'sounds',
        source: 'reaction.settings',
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
export function createTrackMutedEvent(mediaType: string, reason: string, muted = true) {
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
 * Creates an event for joining a vpaas conference.
 *
 * @param {string} tenant - The conference tenant.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createVpaasConferenceJoinedEvent(tenant: string) {
    return {
        action: 'vpaas.conference.joined',
        attributes: {
            tenant
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
export function createWelcomePageEvent(action: string, actionSubject?: string, attributes = {}) {
    return {
        action,
        actionSubject,
        attributes,
        source: 'welcomePage'
    };
}

/**
 * Creates an event which indicates a screenshot of the screensharing has been taken.
 *
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createScreensharingCaptureTakenEvent() {
    return {
        action: 'screen.sharing.capture.taken'
    };
}

/**
 * Creates an event for an action on breakout rooms.
 *
 * @param {string} actionSubject - The subject that was acted upon.
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createBreakoutRoomsEvent(actionSubject: string) {
    return {
        action: 'clicked',
        actionSubject: `${actionSubject}.button`,
        source: 'breakout.rooms'
    };
}

/**
 * Creates an event which indicates a GIF was sent.
 *
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createGifSentEvent() {
    return {
        action: 'gif.sent'
    };
}

/**
 * Creates an event which indicates the whiteboard was opened.
 *
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createOpenWhiteboardEvent() {
    return {
        action: 'whiteboard.open'
    };
}

/**
 * Creates an event which indicates the whiteboard limit was enforced.
 *
 * @returns {Object} The event in a format suitable for sending via
 * sendAnalytics.
 */
export function createRestrictWhiteboardEvent() {
    return {
        action: 'whiteboard.restrict'
    };
}
