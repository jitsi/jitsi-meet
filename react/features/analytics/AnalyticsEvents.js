/**
 * The target of a pin or unpin event was the local participant.
 *
 * Known full event names:
 * pinned.local
 * unpinned.local
 *
 * @type {String}
 */
export const _LOCAL = 'local';

/**
 * The target of a pin or unpin event was a remote participant.
 *
 * Known full event names:
 * pinned.remote
 * unpinned.remote
 *
 * @type {String}
 */
export const _REMOTE = 'remote';

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
 * Audio only mode has been turned off.
 *
 * @type {String}
 */
export const AUDIO_ONLY_DISABLED = 'audioonly.disabled';

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
 * Performing a mute or unmute event based on a callkit setMuted event.
 *
 * Known full event names:
 * callkit.audio.muted
 * callkit.audio.unmuted
 *
 * @type {String}
 */
export const CALLKIT_AUDIO_ = 'callkit.audio';

/**
 * Toggling remote and local video display when entering or exiting backgrounded
 * app state.
 *
 * @type {String}
 */
export const CALLKIT_BACKGROUND_VIDEO_MUTED = 'callkit.background.video.muted';

/**
 * The local participant joined audio muted.
 *
 * @type {String}
 */
export const CONFERENCE_AUDIO_INITIALLY_MUTED
    = 'conference.audio.initiallyMuted';

/**
 * The local participant has started desktop sharing.
 *
 * @type {String}
 */
export const CONFERENCE_SHARING_DESKTOP_START
    = 'conference.sharingDesktop.start';

/**
 * The local participant was desktop sharing but has stopped.
 *
 * @type {String}
 */
export const CONFERENCE_SHARING_DESKTOP_STOP
    = 'conference.sharingDesktop.stop';

/**
 * The local participant joined video muted.
 *
 * @type {String}
 */
export const CONFERENCE_VIDEO_INITIALLY_MUTED
    = 'conference.video.initiallyMuted';

/**
 * The list of known input/output devices was changed and new audio input has
 * been used and should start as muted.
 *
 * @type {String}
 */
export const DEVICE_LIST_CHANGED_AUDIO_MUTED = 'deviceListChanged.audio.muted';

/**
 * The list of known devices was changed and new video input has been used
 * and should start as muted.
 *
 * @type {String}
 */
export const DEVICE_LIST_CHANGED_VIDEO_MUTED = 'deviceListChanged.video.muted';

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
 * The local participant has pinned a participant to remain on large video.
 *
 * Known full event names:
 * pinned.local
 * pinned.remote
 *
 * @type {String}
 */
export const PINNED_ = 'pinned';

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
 * The local participant failed to start receiving high quality video from
 * a remote participant, which is usually initiated by the remote participant
 * being put on large video.
 *
 * @type {String}
 */
export const SELECT_PARTICIPANT_FAILED = 'selectParticipant.failed';

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
 * Attempted to start sharing a YouTube video but one is already being shared.
 *
 * @type {String}
 */
export const SHARED_VIDEO_ALREADY_SHARED = 'sharedvideo.alreadyshared';

/**
 * The local participant's mic was muted automatically during a shared video.
 *
 * @type {String}
 */
export const SHARED_VIDEO_AUDIO_MUTED = 'sharedvideo.audio.muted';

/**
 * The local participant's mic was unmuted automatically during a shared video.
 *
 * @type {String}
 */
export const SHARED_VIDEO_AUDIO_UNMUTED = 'sharedvideo.audio.unmuted';

/**
 * Canceled the prompt to enter a YouTube video to share.
 *
 * @type {String}
 */
export const SHARED_VIDEO_CANCELED = 'sharedvideo.canceled';

/**
 * The shared YouTube video has been paused.
 *
 * @type {String}
 */
export const SHARED_VIDEO_PAUSED = 'sharedvideo.paused';

/**
 * Started sharing a YouTube video.
 *
 * @type {String}
 */
export const SHARED_VIDEO_STARTED = 'sharedvideo.started';

/**
 * Confirmed stoppage of the shared YouTube video.
 *
 * @type {String}
 */
export const SHARED_VIDEO_STOPPED = 'sharedvideo.stoped';

/**
 * The shared YouTube video had its volume change.
 *
 * @type {String}
 */
export const SHARED_VIDEO_VOLUME_CHANGED = 'sharedvideo.volumechanged';

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
 * The config specifies the local participant should start with audio only mode
 * enabled or disabled.
 *
 * Known full event names:
 * startaudioonly.enabled
 * startaudioonly.disabled
 *
 * @type {String}
 */
export const START_AUDIO_ONLY_ = 'startaudioonly';

/**
 * The config specifies the local participant should start with audio mute
 * enabled or disabled.
 *
 * Known full event names:
 * startmuted.client.audio.muted
 * startmuted.client.audio.unmuted
 *
 * @type {String}
 */
export const START_MUTED_CLIENT_AUDIO_ = 'startmuted.client.audio';

/**
 * The config specifies the local participant should start with video mute
 * enabled or disabled.
 *
 * Known full event names:
 * startmuted.client.video.muted
 * startmuted.client.video.unmuted
 *
 * @type {String}
 */
export const START_MUTED_CLIENT_VIDEO_ = 'startmuted.client.video';

/**
 * The local participant has received an event from the server stating to
 * start audio muted or unmuted.
 *
 * Known full event names:
 * startmuted.server.audio.muted
 * startmuted.server.audio.unmuted
 *
 * @type {String}
 */
export const START_MUTED_SERVER_AUDIO_ = 'startmuted.server.audio';

/**
 * The local participant has received an event from the server stating to
 * start video muted or unmuted.
 *
 * Known full event names:
 * startmuted.server.video.muted
 * startmuted.server.video.unmuted
 *
 * @type {String}
 */
export const START_MUTED_SERVER_VIDEO_ = 'startmuted.server.video';

/**
 * How long it took to switch between simulcast streams.
 *
 * Properties: value
 *
 * @type {String}
 */
export const STREAM_SWITCH_DELAY = 'stream.switch.delay';

/**
 * Automatically changing the mute state of a media track in order to match
 * the current stored state in redux.
 *
 * Known full event names:
 * synctrackstate.audio.muted
 * synctrackstate.audio.unmuted
 * synctrackstate.video.muted
 * synctrackstate.video.unmuted
 *
 * @type {String}
 */
export const SYNC_TRACK_STATE_ = 'synctrackstate';

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
 * The local participant has unpinned a participant so the participant doesn't
 * remain permanently on local large video.
 *
 * Known full event names:
 * unpinned.local
 * unpinned.remote
 *
 * @type {String}
 */
export const UNPINNED_ = 'unpinned';
