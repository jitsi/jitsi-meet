/**
 * The constant for the event type 'track'.
 * TODO: keep this constants in a single place. Can we import them from
 * lib-jitsi-meet's AnalyticsEvents somehow?
 * @type {string}
 */
const TYPE_TRACK = 'track';

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
 * Audio mute toggled was triggered through the jitsi-meet api.
 *
 * @type {String}
 */
export const API_TOGGLE_AUDIO = 'api.toggle.audio';

/**
 * Video mute toggling was triggered through the jitsi-meet api.
 *
 * @type {String}
 */
export const API_TOGGLE_VIDEO = 'api.toggle.video';

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
 * Replacing the currently used track of specified type with a new track of the
 * same type. The event is fired when changing devices.
 *
 * Known full event names:
 * replacetrack.audio
 * replacetrack.video
 *
 * @type {String}
 */
export const REPLACE_TRACK_ = 'replacetrack';

/**
 * The local participant began using a different audio input device (mic).
 *
 * @type {String}
 */
export const SETTINGS_CHANGE_DEVICE_AUDIO_IN = 'settings.changeDevice.audioIn';

/**
 * The local participant began using a different audio output device (speaker).
 *
 * @type {String}
 */
export const SETTINGS_CHANGE_DEVICE_AUDIO_OUT
    = 'settings.changeDevice.audioOut';

/**
 * The local participant began using a different camera.
 *
 * @type {String}
 */
export const SETTINGS_CHANGE_DEVICE_VIDEO = 'settings.changeDevice.video';

/**
 * Pressed the keyboard shortcut for toggling audio mute.
 *
 * @type {String}
 */
export const SHORTCUT_AUDIO_MUTE_TOGGLED = 'shortcut.audiomute.toggled';

/**
 * Pressed the keyboard shortcut for toggling chat panel display.
 *
 * @type {String}
 */
export const SHORTCUT_CHAT_TOGGLED = 'shortcut.chat.toggled';

/**
 * Toggled the display of the keyboard shortcuts help dialog.
 *
 * @type {String}
 */
export const SHORTCUT_HELP = 'shortcut.shortcut.help';

/**
 * Pressed the keyboard shortcut for togglgin raise hand status.
 *
 * @type {String}
 */
export const SHORTCUT_RAISE_HAND_CLICKED = 'shortcut.raisehand.clicked';

/**
 * Pressed the keyboard shortcut for toggling screenshare.
 *
 * @type {String}
 */
export const SHORTCUT_SCREEN_TOGGLED = 'shortcut.screen.toggled';

/**
 * Toggled the display of the speaker stats dialog.
 *
 * @type {String}
 */
export const SHORTCUT_SPEAKER_STATS_CLICKED = 'shortcut.speakerStats.clicked';

/**
 * Started pressing the key that undoes audio mute while the key is pressed.
 *
 * @type {String}
 */
export const SHORTCUT_TALK_CLICKED = 'shortcut.talk.clicked';

/**
 * Released the key used to talk while audio muted, returning to the audio muted
 * state.
 *
 * @type {String}
 */
export const SHORTCUT_TALK_RELEASED = 'shortcut.talk.released';

/**
 * Toggling video mute state using a keyboard shortcut.
 *
 * @type {String}
 */
export const SHORTCUT_VIDEO_MUTE_TOGGLED = 'shortcut.videomute.toggled';

/**
 * Clicked the toolbar button to enter audio mute state.
 *
 * @type {String}
 */
export const TOOLBAR_AUDIO_MUTED = 'toolbar.audio.muted';

/**
 * Clicked within a toolbar menu to enable audio only.
 *
 * @type {String}
 */
export const TOOLBAR_AUDIO_ONLY_ENABLED = 'toolbar.audioonly.enabled';

/**
 * Clicked the toolbar button to exit audio mute state.
 *
 * @type {String}
 */
export const TOOLBAR_AUDIO_UNMUTED = 'toolbar.audio.unmuted';

/**
 * Clicked the toolbar button for toggling chat panel display.
 *
 * @type {String}
 */
export const TOOLBAR_CHAT_TOGGLED = 'toolbar.chat.toggled';

/**
 * Clicked the toolbar button for toggling contact list panel display.
 *
 * @type {String}
 */
export const TOOLBAR_CONTACTS_TOGGLED = 'toolbar.contacts.toggled';

/**
 * Clicked the toolbar button to toggle display of etherpad (collaborative
 * document writing).
 *
 * @type {String}
 */
export const TOOLBAR_ETHERPACK_CLICKED = 'toolbar.etherpad.clicked';

/**
 * Pressed the keyboard shortcut to open the device selection window while in
 * filmstrip only mode.
 *
 * @type {String}
 */
export const TOOLBAR_FILMSTRIP_ONLY_DEVICE_SELECTION_TOGGLED
    = 'toolbar.fodeviceselection.toggled';

/**
 * Visibility of the filmstrip has been toggled.
 *
 * @type {String}
 */
export const TOOLBAR_FILMSTRIP_TOGGLED = 'toolbar.filmstrip.toggled';

/**
 * Clicked the toolbar button to toggle display full screen mode.
 *
 * @type {String}
 */
export const TOOLBAR_FULLSCREEN_ENABLED = 'toolbar.fullscreen.enabled';

/**
 * Clicked the toolbar button to leave the conference.
 *
 * @type {String}
 */
export const TOOLBAR_HANGUP = 'toolbar.hangup';

/**
 * Clicked the toolbar button to open the invite dialog.
 *
 * @type {String}
 */
export const TOOLBAR_INVITE_CLICKED = 'toolbar.invite.clicked';

/**
 * The invite dialog has been dismissed.
 *
 * @type {String}
 */
export const TOOLBAR_INVITE_CLOSE = 'toolbar.invite.close';

/**
 * Clicked the toolbar button for toggling the display of the profile panel.
 *
 * @type {String}
 */
export const TOOLBAR_PROFILE_TOGGLED = 'toolbar.profile.toggled';

/**
 * Clicked the toolbar button for toggling raise hand status.
 *
 * @type {String}
 */
export const TOOLBAR_RAISE_HAND_CLICKED = 'toolbar.raiseHand.clicked';

/**
 * Clicked the toolbar button to stop screensharing.
 *
 * @type {String}
 */
export const TOOLBAR_SCREEN_DISABLED = 'toolbar.screen.disabled';

/**
 * Clicked the toolbar button to start screensharing.
 *
 * @type {String}
 */
export const TOOLBAR_SCREEN_ENABLED = 'toolbar.screen.enabled';

/**
 * Clicked the toolbar button for toggling display of the settings menu.
 *
 * @type {String}
 */
export const TOOLBAR_SETTINGS_TOGGLED = 'toolbar.settings.toggled';

/**
 * Clicked the toolbar button for toggling a shared YouTube video.
 *
 * @type {String}
 */
export const TOOLBAR_SHARED_VIDEO_CLICKED = 'toolbar.sharedvideo.clicked';

/**
 * Clicked the toolbar button to open the dial-out feature.
 *
 * @type {String}
 */
export const TOOLBAR_SIP_DIALPAD_CLICKED = 'toolbar.sip.dialpad.clicked';

/**
 * In the mobile app, clicked on the toolbar button to toggle video mute.
 *
 * Known full event names:
 * toolbar.video.muted
 * toolbar.video.unmuted
 *
 * @type {String}
 */
export const TOOLBAR_VIDEO_ = 'toolbar.video';

/**
 * Clicked on the toolbar to video unmute.
 *
 * @type {String}
 */
export const TOOLBAR_VIDEO_DISABLED = 'toolbar.video.disabled';

/**
 * Clicked on the toolbar to video mute.
 *
 * @type {String}
 */
export const TOOLBAR_VIDEO_ENABLED = 'toolbar.video.enabled';

/**
 * Clicked within a toolbar menu to set max incoming video quality to high
 * definition.
 *
 * @type {String}
 */
export const TOOLBAR_VIDEO_QUALITY_HIGH = 'toolbar.videoquality.high';

/**
 * Clicked within a toolbar menu to set max incoming video quality to low
 * definition.
 *
 * @type {String}
 */
export const TOOLBAR_VIDEO_QUALITY_LOW = 'toolbar.videoquality.low';

/**
 * Clicked within a toolbar menu to set max incoming video quality to standard
 * definition.
 *
 * @type {String}
 */
export const TOOLBAR_VIDEO_QUALITY_STANDARD = 'toolbar.videoquality.standard';

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
