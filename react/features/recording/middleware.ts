import { batch } from 'react-redux';

import { createRecordingEvent } from '../analytics/AnalyticsEvents';
import { sendAnalytics } from '../analytics/functions';
import { IStore } from '../app/types';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app/actionTypes';
import { CONFERENCE_JOIN_IN_PROGRESS } from '../base/conference/actionTypes';
import { getCurrentConference } from '../base/conference/functions';
import { openDialog } from '../base/dialog/actions';
import JitsiMeetJS, {
    JitsiConferenceEvents,
    JitsiRecordingConstants
} from '../base/lib-jitsi-meet';
import {
    setAudioMuted,
    setAudioUnmutePermissions,
    setVideoMuted,
    setVideoUnmutePermissions
} from '../base/media/actions';
import { MEDIA_TYPE } from '../base/media/constants';
import { PARTICIPANT_UPDATED } from '../base/participants/actionTypes';
import { updateLocalRecordingStatus } from '../base/participants/actions';
import { PARTICIPANT_ROLE } from '../base/participants/constants';
import { getLocalParticipant, getParticipantDisplayName } from '../base/participants/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import {
    playSound,
    stopSound
} from '../base/sounds/actions';
import { TRACK_ADDED } from '../base/tracks/actionTypes';
import { hideNotification, showErrorNotification, showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';
import { isRecorderTranscriptionsRunning, isTranscribing } from '../transcribing/functions';

import { RECORDING_SESSION_UPDATED, START_LOCAL_RECORDING, STOP_LOCAL_RECORDING } from './actionTypes';
import {
    clearRecordingSessions,
    hidePendingRecordingNotification,
    markConsentRequested,
    setStartRecordingIntent,
    showPendingRecordingNotification,
    showRecordingError,
    showRecordingWarning,
    showStartRecordingNotification,
    showStartedRecordingNotification,
    showStoppedRecordingNotification,
    updateRecordingSessionData
} from './actions';
import { RecordingConsentDialog } from './components/Recording';
import LocalRecordingManager from './components/Recording/LocalRecordingManager';
import {
    LIVE_STREAMING_OFF_SOUND_ID,
    LIVE_STREAMING_ON_SOUND_ID,
    RECORDING_AND_TRANSCRIPTION_OFF_SOUND_ID,
    RECORDING_AND_TRANSCRIPTION_ON_SOUND_ID,
    RECORDING_OFF_SOUND_ID,
    RECORDING_ON_SOUND_ID,
    START_RECORDING_NOTIFICATION_ID,
    TRANSCRIPTION_ON_SOUND_ID
} from './constants';
import {
    getResourceId,
    getSessionById,
    registerRecordingAudioFiles,
    shouldRequireRecordingConsent,
    unregisterRecordingAudioFiles
} from './functions';
import logger from './logger';

/**
 * Map to track which recording sessions have transcription enabled.
 */
const sessionsWithTranscription = new Map<string, boolean>();

/**
 * Pending notification data stored when the notification is deferred
 * until both recording and transcription have resolved.
 */
let pendingNotificationInitiator: { getId: Function; } | string | undefined;
let pendingNotificationSessionId: string | undefined;
let pendingNotificationMode: string | undefined;

/**
 * Evaluates whether all intended services (recording and/or transcription) have
 * resolved (succeeded or failed) and plays the appropriate start sound and notification.
 *
 * Intent source:
 *  - Local client: startRecordingIntent (synchronous Redux flag from dialog).
 *  - Remote client: room metadata (isRecordingRequested + isTranscribingEnabled).
 *
 * Resolution is derived from existing Redux state — no separate tracking needed.
 *
 * Called from:
 *  - Recording middleware when RECORDING_SESSION_UPDATED arrives with ON or error.
 *  - Transcription subscriber when isRecorderTranscriptionsRunning becomes true.
 *  - Subtitles middleware when conference.dial() fails.
 *  - Transcribing middleware when TRANSCRIBER_LEFT abruptly.
 *  - Metadata change listener when room metadata updates.
 *
 * @param {Function} dispatch - Redux dispatch.
 * @param {Function} getState - Redux getState.
 * @returns {void}
 */
export function maybeNotifyRecordingStart(dispatch: IStore['dispatch'], getState: IStore['getState']) {
    const state = getState();

    // Determine intent: local client uses Redux flag, remote uses metadata.
    const localIntent = state['features/recording'].startRecordingIntent;
    const metadata = state['features/base/conference'].metadata?.recording;

    const wantsRecording = localIntent?.recording ?? metadata?.isRecordingRequested ?? false;
    const wantsTranscription = localIntent?.transcription ?? metadata?.isTranscribingEnabled ?? false;

    // No intent from either source — nothing to coordinate. Most probably we haven't received the metadata yet.
    if (!wantsRecording && !wantsTranscription) {
        return;
    }

    const { sessionDatas } = state['features/recording'];
    const { mode: modeConstants, status: statusConstants } = JitsiRecordingConstants;

    // Derive recording resolution from session data.
    const recordingOn = sessionDatas.some(
        sd => sd.mode === modeConstants.FILE && sd.status === statusConstants.ON);
    const recordingFailed = sessionDatas.some(
        sd => sd.mode === modeConstants.FILE && sd.error);
    const recordingResolved = !wantsRecording || recordingOn || recordingFailed;

    // Derive transcription resolution from existing state.
    const transcriptionOn = isRecorderTranscriptionsRunning(state) || isTranscribing(state);
    const transcriptionFailed = state['features/subtitles']._hasError;
    const transcriptionResolved = !wantsTranscription || transcriptionOn || transcriptionFailed;

    // Wait until all intended services have resolved.
    // Note: In theory (it should never happen here) wantsTranscription/wantsRecording might be false and in the same
    // time the transcriptionOn/recordingOn might be true. In this case we would play a notification no matter that
    // wantsTranscription/wantsRecording is false. This is better because the recording/transcription are on and the
    // user has to be informed. Also if this ever happens it will be noticeable and we will be able to debug/fix.
    if (!recordingResolved || !transcriptionResolved) {
        return;
    }

    // Both resolved — determine which sound to play.
    let soundID: string | undefined;

    if (recordingOn && transcriptionOn) {
        soundID = RECORDING_AND_TRANSCRIPTION_ON_SOUND_ID;
    } else if (recordingOn) {
        soundID = RECORDING_ON_SOUND_ID;
    } else if (transcriptionOn) {
        soundID = TRANSCRIPTION_ON_SOUND_ID;
    }
    // If both failed — no start sound (error notifications handle it).

    if (soundID) {
        dispatch(playSound(soundID));
    }

    // Store final state in sessionsWithTranscription for the stop sound later.
    const activeSession = sessionDatas.find(
        sd => sd.mode === modeConstants.FILE && sd.status === statusConstants.ON);

    if (activeSession?.id) {
        sessionsWithTranscription.set(activeSession.id, recordingOn && transcriptionOn);
    }

    // Show deferred notification if we have a pending initiator.
    if (pendingNotificationInitiator && pendingNotificationMode && pendingNotificationSessionId) {
        const finalWillTranscribe = recordingOn && transcriptionOn;

        dispatch(showStartedRecordingNotification(
            pendingNotificationMode,
            pendingNotificationInitiator,
            pendingNotificationSessionId,
            finalWillTranscribe));

        pendingNotificationInitiator = undefined;
        pendingNotificationSessionId = undefined;
        pendingNotificationMode = undefined;
    } else if (transcriptionOn && !recordingOn) {
        // Transcription-only case (recording failed or wasn't requested).
        // Show transcription notification since there's no pending recording notification.
        dispatch(showNotification({
            descriptionKey: 'transcribing.on',
            titleKey: 'dialog.recording'
        }, NOTIFICATION_TIMEOUT_TYPE.SHORT));
    }

    // Clear local intent — prevents re-triggering.
    if (localIntent) {
        dispatch(setStartRecordingIntent(null));
    }
}

/**
 * StateListenerRegistry provides a reliable way to detect the leaving of a
 * conference, where we need to clean up the recording sessions.
 */
StateListenerRegistry.register(
    /* selector */ state => getCurrentConference(state),
    /* listener */ (conference, { dispatch }) => {
        if (!conference) {
            dispatch(clearRecordingSessions());
            sessionsWithTranscription.clear();
            pendingNotificationInitiator = undefined;
            pendingNotificationSessionId = undefined;
            pendingNotificationMode = undefined;
        }
    }
);

/**
 * Listen for metadata changes to trigger sound coordination on the remote side.
 * When metadata arrives with recording intent, re-evaluate whether we can play the sound.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/conference'].metadata?.recording,
    /* listener */ (recordingMetadata, { dispatch, getState }, previousValue) => {
        if (!previousValue && recordingMetadata) {
            maybeNotifyRecordingStart(dispatch, getState);
        }
    }
);

/**
 * The redux middleware to handle the recorder updates in a React way.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    let oldSessionData;

    if (action.type === RECORDING_SESSION_UPDATED) {
        oldSessionData
            = getSessionById(getState(), action.sessionData.id);
    }

    const result = next(action);

    switch (action.type) {
    case APP_WILL_MOUNT:
        registerRecordingAudioFiles(dispatch);

        break;

    case APP_WILL_UNMOUNT:
        unregisterRecordingAudioFiles(dispatch);

        break;

    case CONFERENCE_JOIN_IN_PROGRESS: {
        const { conference } = action;

        conference.on(
            JitsiConferenceEvents.RECORDER_STATE_CHANGED,
            (recorderSession: any) => {
                if (recorderSession) {
                    recorderSession.getID() && dispatch(updateRecordingSessionData(recorderSession));
                    if (recorderSession.getError()) {
                        _showRecordingErrorNotification(recorderSession, dispatch, getState);
                    } else {
                        _showExplicitConsentDialog(recorderSession, dispatch, getState);
                    }
                }

                return;
            });

        break;
    }

    case START_LOCAL_RECORDING: {
        const { localRecording } = getState()['features/base/config'];
        const { onlySelf } = action;

        LocalRecordingManager.startLocalRecording({
            dispatch,
            getState
        }, action.onlySelf)
        .then(() => {
            const props = {
                descriptionKey: 'recording.on',
                titleKey: 'dialog.recording'
            };

            if (localRecording?.notifyAllParticipants && !onlySelf) {
                dispatch(playSound(RECORDING_ON_SOUND_ID));
            }
            dispatch(showNotification(props, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
            dispatch(showNotification({
                titleKey: 'recording.localRecordingStartWarningTitle',
                descriptionKey: 'recording.localRecordingStartWarning'
            }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
            dispatch(updateLocalRecordingStatus(true, onlySelf));
            sendAnalytics(createRecordingEvent('started', `local${onlySelf ? '.self' : ''}`));
            if (typeof APP !== 'undefined') {
                APP.API.notifyRecordingStatusChanged(
                    true, 'local', undefined, isRecorderTranscriptionsRunning(getState()));
            }
        })
        .catch(err => {
            logger.error('Capture failed', err);

            let descriptionKey = 'recording.error';

            if (err.message === 'WrongSurfaceSelected') {
                descriptionKey = 'recording.surfaceError';

            } else if (err.message === 'NoLocalStreams') {
                descriptionKey = 'recording.noStreams';
            } else if (err.message === 'NoMicTrack') {
                descriptionKey = 'recording.noMicPermission';
            }
            const props = {
                descriptionKey,
                titleKey: 'recording.failedToStart'
            };

            if (typeof APP !== 'undefined') {
                APP.API.notifyRecordingStatusChanged(
                    false, 'local', err.message, isRecorderTranscriptionsRunning(getState()));
            }

            dispatch(showErrorNotification(props));
        });
        break;
    }

    case STOP_LOCAL_RECORDING: {
        const { localRecording } = getState()['features/base/config'];

        if (LocalRecordingManager.isRecordingLocally()) {
            LocalRecordingManager.stopLocalRecording();
            dispatch(updateLocalRecordingStatus(false));
            if (localRecording?.notifyAllParticipants && !LocalRecordingManager.selfRecording) {
                dispatch(playSound(RECORDING_OFF_SOUND_ID));
            }
            if (typeof APP !== 'undefined') {
                APP.API.notifyRecordingStatusChanged(
                    false, 'local', undefined, isRecorderTranscriptionsRunning(getState()));
            }
        }
        break;
    }

    case RECORDING_SESSION_UPDATED: {
        const state = getState();

        // When in recorder mode no notifications are shown
        // or extra sounds are also not desired
        // but we want to indicate those in case of sip gateway
        const {
            iAmRecorder,
            iAmSipGateway
        } = state['features/base/config'];

        if (iAmRecorder && !iAmSipGateway) {
            break;
        }

        const updatedSessionData
            = getSessionById(state, action.sessionData.id);
        const { initiator, mode = '', terminator } = updatedSessionData ?? {};
        const { PENDING, OFF, ON } = JitsiRecordingConstants.status;
        const isRecordingStarting = updatedSessionData?.status === PENDING && oldSessionData?.status !== PENDING;

        if (isRecordingStarting || updatedSessionData?.status === ON) {
            dispatch(hideNotification(START_RECORDING_NOTIFICATION_ID));
        }

        if (isRecordingStarting) {
            dispatch(showPendingRecordingNotification(mode));
            break;
        }

        dispatch(hidePendingRecordingNotification(mode));

        if (updatedSessionData?.status === ON) {
            const sessionId = action.sessionData.id;

            // We receive 2 updates of the session status ON. The first one is from jibri when it joins.
            // The second one is from jicofo which will deliver the initiator value. Since the start
            // recording notification uses the initiator value we skip the jibri update and show the
            // notification on the update from jicofo.
            // FIXME: simplify checks when the backend start sending only one status ON update containing
            // the initiator.
            if (initiator && !oldSessionData?.initiator) {
                const localIntent = state['features/recording'].startRecordingIntent;
                const metadata = state['features/base/conference'].metadata?.recording;
                const wantsTranscription = localIntent?.transcription ?? metadata?.isTranscribingEnabled ?? false;

                if (wantsTranscription) {
                    // Defer notification — maybeNotifyRecordingStart will show it
                    // once both recording and transcription have resolved.
                    pendingNotificationInitiator = initiator;
                    pendingNotificationSessionId = sessionId;
                    pendingNotificationMode = mode;

                    // Re-evaluate in case both services already resolved.
                    maybeNotifyRecordingStart(dispatch, getState);
                } else {
                    dispatch(showStartedRecordingNotification(mode, initiator, sessionId, false));
                }
            }

            if (oldSessionData?.status !== ON) {
                sendAnalytics(createRecordingEvent('start', mode));

                if (mode === JitsiRecordingConstants.mode.FILE) {
                    // maybeNotifyRecordingStart handles both local (via startRecordingIntent)
                    // and remote (via metadata). It waits for all intended services to resolve.
                    maybeNotifyRecordingStart(dispatch, getState);
                } else if (mode === JitsiRecordingConstants.mode.STREAM) {
                    dispatch(playSound(LIVE_STREAMING_ON_SOUND_ID));
                }

                if (typeof APP !== 'undefined') {
                    APP.API.notifyRecordingStatusChanged(
                        true, mode, undefined, isRecorderTranscriptionsRunning(state));
                }
            }
        } else if (updatedSessionData?.status === OFF && oldSessionData?.status !== OFF) {
            const participantName = terminator
                ? getParticipantDisplayName(state, getResourceId(terminator))
                : undefined;

            // Check if transcription was enabled when the recording started
            const sessionId = action.sessionData.id;
            const wasWithTranscription = sessionId ? sessionsWithTranscription.get(sessionId) ?? false : false;

            dispatch(showStoppedRecordingNotification(mode, participantName, wasWithTranscription));

            let duration = 0, soundOff, soundOn;

            if (oldSessionData?.timestamp) {
                duration
                    = (Date.now() / 1000) - oldSessionData.timestamp;
            }
            sendAnalytics(createRecordingEvent('stop', mode, duration));

            if (mode === JitsiRecordingConstants.mode.FILE) {
                if (wasWithTranscription) {
                    soundOff = RECORDING_AND_TRANSCRIPTION_OFF_SOUND_ID;
                    soundOn = RECORDING_AND_TRANSCRIPTION_ON_SOUND_ID;
                } else {
                    soundOff = RECORDING_OFF_SOUND_ID;
                    soundOn = RECORDING_ON_SOUND_ID;
                }

                // Clean up the entry when recording stops
                if (sessionId) {
                    sessionsWithTranscription.delete(sessionId);
                }
            } else if (mode === JitsiRecordingConstants.mode.STREAM) {
                soundOff = LIVE_STREAMING_OFF_SOUND_ID;
                soundOn = LIVE_STREAMING_ON_SOUND_ID;
            }

            if (soundOff && soundOn) {
                dispatch(stopSound(soundOn));
                dispatch(playSound(soundOff));
            }

            if (typeof APP !== 'undefined') {
                APP.API.notifyRecordingStatusChanged(
                    false, mode, undefined, isRecorderTranscriptionsRunning(state));
            }
        }

        break;
    }
    case TRACK_ADDED: {
        const { track } = action;

        if (LocalRecordingManager.isRecordingLocally()
                && track.mediaType === MEDIA_TYPE.AUDIO && track.local) {
            const audioTrack = track.jitsiTrack.track;

            LocalRecordingManager.addAudioTrackToLocalRecording(audioTrack);
        }
        break;
    }
    case PARTICIPANT_UPDATED: {
        const { id, role } = action.participant;
        const state = getState();
        const localParticipant = getLocalParticipant(state);

        if (localParticipant?.id !== id) {
            return next(action);
        }

        if (role === PARTICIPANT_ROLE.MODERATOR) {
            dispatch(showStartRecordingNotification());
        }

        return next(action);
    }
    }

    return result;
});

/**
 * Shows a notification about an error in the recording session. A
 * default notification will display if no error is specified in the passed
 * in recording session.
 *
 * @private
 * @param {Object} session - The recorder session model from the
 * lib.
 * @param {Dispatch} dispatch - The Redux Dispatch function.
 * @param {Function} getState - The Redux getState function.
 * @returns {void}
 */
function _showRecordingErrorNotification(session: any, dispatch: IStore['dispatch'], getState: IStore['getState']) {
    const mode = session.getMode();
    const error = session.getError();
    const isStreamMode = mode === JitsiMeetJS.constants.recording.mode.STREAM;

    switch (error) {
    case JitsiMeetJS.constants.recording.error.SERVICE_UNAVAILABLE:
        dispatch(showRecordingError({
            descriptionKey: 'recording.unavailable',
            descriptionArguments: {
                serviceName: isStreamMode
                    ? '$t(liveStreaming.serviceName)'
                    : '$t(recording.serviceName)'
            },
            titleKey: isStreamMode
                ? 'liveStreaming.unavailableTitle'
                : 'recording.unavailableTitle'
        }));
        break;
    case JitsiMeetJS.constants.recording.error.RESOURCE_CONSTRAINT:
        dispatch(showRecordingError({
            descriptionKey: isStreamMode
                ? 'liveStreaming.busy'
                : 'recording.busy',
            titleKey: isStreamMode
                ? 'liveStreaming.busyTitle'
                : 'recording.busyTitle'
        }));
        break;
    case JitsiMeetJS.constants.recording.error.UNEXPECTED_REQUEST:
        dispatch(showRecordingWarning({
            descriptionKey: isStreamMode
                ? 'liveStreaming.sessionAlreadyActive'
                : 'recording.sessionAlreadyActive',
            titleKey: isStreamMode ? 'liveStreaming.inProgress' : 'recording.inProgress'
        }));
        break;
    case JitsiMeetJS.constants.recording.error.POLICY_VIOLATION:
        dispatch(showRecordingWarning({
            descriptionKey: isStreamMode ? 'liveStreaming.policyError' : 'recording.policyError',
            titleKey: isStreamMode ? 'liveStreaming.failedToStart' : 'recording.failedToStart'
        }));
        break;
    default:
        dispatch(showRecordingError({
            descriptionKey: isStreamMode
                ? 'liveStreaming.error'
                : 'recording.error',
            titleKey: isStreamMode
                ? 'liveStreaming.failedToStart'
                : 'recording.failedToStart'
        }));
        break;
    }

    if (typeof APP !== 'undefined') {
        APP.API.notifyRecordingStatusChanged(false, mode, error, isRecorderTranscriptionsRunning(getState()));
    }

    // Recording failed — re-evaluate. maybeNotifyRecordingStart derives state from
    // sessionDatas (which now has the error) and will play transcription-only sound
    // if transcription succeeded.
    const intent = getState()['features/recording'].startRecordingIntent;

    if (intent) {
        maybeNotifyRecordingStart(dispatch, getState);
    }
}

/**
 * Mutes audio and video and displays the RecordingConsentDialog when the conditions are met.
 *
 * @param {any} recorderSession - The recording session.
 * @param {Function} dispatch - The Redux dispatch function.
 * @param {Function} getState - The Redux getState function.
 * @returns {void}
 */
function _showExplicitConsentDialog(recorderSession: any, dispatch: IStore['dispatch'], getState: IStore['getState']) {
    if (!shouldRequireRecordingConsent(recorderSession, getState())) {
        return;
    }

    // Capture the current mute state BEFORE forcing mute for consent
    // This preserves the user's intentional mute choices from prejoin or initial settings
    const state = getState();
    const audioWasMuted = state['features/base/media'].audio.muted;
    const videoWasMuted = state['features/base/media'].video.muted;

    batch(() => {
        dispatch(markConsentRequested(recorderSession.getID()));
        dispatch(setAudioUnmutePermissions(true, true));
        dispatch(setVideoUnmutePermissions(true, true));
        dispatch(setAudioMuted(true));
        dispatch(setVideoMuted(true));
        dispatch(openDialog('RecordingConsentDialog', RecordingConsentDialog, {
            audioWasMuted,
            videoWasMuted
        }));
    });
}
