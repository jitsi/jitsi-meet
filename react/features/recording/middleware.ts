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
    setStopRecordingIntent,
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
    TRANSCRIPTION_OFF_SOUND_ID,
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
import { ISessionData } from './reducer';

/**
 * Evaluates whether all intended services (recording and/or transcription) have
 * resolved (succeeded or failed) and plays the appropriate start sound and notification.
 *
 * Intent source: {@code startRecordingIntent} — populated on the local side by the
 * start dialog / auto-start callback, and on remote observers by the metadata listener
 * when a false→true transition of isRecordingRequested / isTranscribingEnabled is seen.
 *
 * Resolution is derived from existing Redux state — no separate tracking needed.
 * The recording notification's "started by …" name is read directly from the active
 * FILE session in {@code sessionDatas}. When recording is on but the initiator has not
 * yet been delivered by jicofo, the function waits — keeping the intent alive.
 *
 * Called from:
 *  - Recording middleware when RECORDING_SESSION_UPDATED arrives with the initiator
 *    (jicofo update) or with an error.
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

    const intent = state['features/recording'].startRecordingIntent;

    const wantsRecording = Boolean(intent?.recording);
    const wantsTranscription = Boolean(intent?.transcription);

    // No intent — nothing to coordinate.
    if (!wantsRecording && !wantsTranscription) {
        return;
    }

    const { sessionDatas } = state['features/recording'];
    const { mode: modeConstants, status: statusConstants } = JitsiRecordingConstants;

    // Locate the active FILE recording session (if any) and derive its state.
    const fileSession = sessionDatas.find(sd => sd.mode === modeConstants.FILE
        && (sd.status === statusConstants.ON || sd.error));
    const recordingOn = fileSession?.status === statusConstants.ON;
    const recordingFailed = Boolean(fileSession?.error);
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

    // Recording is on but jicofo hasn't yet delivered the initiator. Wait for it
    // so the notification text reflects who started the recording.
    if (recordingOn && (!fileSession?.initiator || !fileSession.id)) {
        return;
    }

    // Clear the intent BEFORE dispatching below to avoid a re-entrancy double
    // fire — see the matching comment in maybeNotifyRecordingStop.
    if (intent) {
        dispatch(setStartRecordingIntent(null));
    }

    // Determine sound to play now that all intended services have resolved.
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

    if (recordingOn && fileSession?.initiator && fileSession.id) {
        dispatch(showStartedRecordingNotification(
            modeConstants.FILE,
            fileSession.initiator,
            fileSession.id,
            recordingOn && transcriptionOn));
    } else if (transcriptionOn && !recordingOn) {
        // Transcription-only case (recording failed or wasn't requested).
        dispatch(showNotification({
            descriptionKey: 'transcribing.on',
            titleKey: 'dialog.recording'
        }, NOTIFICATION_TIMEOUT_TYPE.SHORT));
    }
}

/**
 * Evaluates whether all intended services (recording and/or transcription) that
 * are being stopped have resolved, and plays the appropriate off sound and
 * notification. Mirror of {@link maybeNotifyRecordingStart}.
 *
 * Intent source: {@code stopRecordingIntent} — populated on the local side by the
 * stop dialog, and on remote observers by the metadata listener when a true→false
 * transition of isRecordingRequested / isTranscribingEnabled is seen.
 *
 * Called from:
 *  - Metadata change listener on true→false transitions.
 *  - Recording middleware when RECORDING_SESSION_UPDATED arrives with OFF.
 *  - Transcription subscriber when isRecorderTranscriptionsRunning becomes false.
 *  - Transcribing middleware when TRANSCRIBER_LEFT abruptly.
 *
 * @param {Function} dispatch - Redux dispatch.
 * @param {Function} getState - Redux getState.
 * @returns {void}
 */
export function maybeNotifyRecordingStop(dispatch: IStore['dispatch'], getState: IStore['getState']) {
    const state = getState();
    const intent = state['features/recording'].stopRecordingIntent;

    if (!intent) {
        return;
    }

    const { sessionDatas } = state['features/recording'];
    const { mode: modeConstants, status: statusConstants } = JitsiRecordingConstants;

    // Recording resolves when there's no active/pending FILE session.
    const activeFileSession = sessionDatas.find(sd =>
        sd.mode === modeConstants.FILE
        && (sd.status === statusConstants.ON || sd.status === statusConstants.PENDING));
    const recordingResolved = !intent.recording || !activeFileSession;

    // Transcription resolves when the selector flips false.
    const transcriptionResolved = !intent.transcription || !isRecorderTranscriptionsRunning(state);

    if (!recordingResolved || !transcriptionResolved) {
        return;
    }

    // Determine sounds + notification.
    let onSoundID: string | undefined;
    let offSoundID: string | undefined;

    if (intent.recording && intent.transcription) {
        onSoundID = RECORDING_AND_TRANSCRIPTION_ON_SOUND_ID;
        offSoundID = RECORDING_AND_TRANSCRIPTION_OFF_SOUND_ID;
    } else if (intent.recording) {
        onSoundID = RECORDING_ON_SOUND_ID;
        offSoundID = RECORDING_OFF_SOUND_ID;
    } else if (intent.transcription) {
        onSoundID = TRANSCRIPTION_ON_SOUND_ID;
        offSoundID = TRANSCRIPTION_OFF_SOUND_ID;
    }

    // Clear the intent BEFORE dispatching below. Otherwise the first dispatch
    // re-enters StateListenerRegistry synchronously; the isRecorderTranscriptionsRunning
    // subscriber (in ../transcribing/subscriber) can fire in that nested walk
    // with an unresolved prevSel and call back into this function while intent
    // is still set — producing a duplicate notification. Reading intent into a
    // local const above keeps the branches below correct.
    dispatch(setStopRecordingIntent(null));

    if (offSoundID) {
        if (onSoundID) {
            dispatch(stopSound(onSoundID));
        }
        dispatch(playSound(offSoundID));
    }

    if (intent.recording) {
        // Pick the most recent FILE OFF session so the "stopped by …" name
        // reflects the current stop, not a stale earlier cycle left in
        // sessionDatas. sessionDatas is append-order, so the last match wins.
        let offSession: ISessionData | undefined;

        sessionDatas.forEach(sd => {
            if (sd.mode === modeConstants.FILE && sd.status === statusConstants.OFF) {
                offSession = sd;
            }
        });

        const participantName = offSession?.terminator
            ? getParticipantDisplayName(state, getResourceId(offSession.terminator))
            : undefined;

        dispatch(showStoppedRecordingNotification(
            modeConstants.FILE, participantName, intent.transcription));
    } else if (intent.transcription) {
        dispatch(showNotification({
            descriptionKey: 'transcribing.off',
            titleKey: 'dialog.recording'
        }, NOTIFICATION_TIMEOUT_TYPE.SHORT));
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
        }
    }
);

/**
 * Listen for metadata changes to coordinate start/stop sound on the remote side.
 * Detects false↔true transitions for {@code isRecordingRequested} and
 * {@code isTranscribingEnabled} and seeds the corresponding intent for remote
 * observers. Local initiators already have the intent set synchronously from
 * their dialog — the {@code if (!existing)} guard prevents clobbering.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/conference'].metadata?.recording,
    /* listener */ (recordingMetadata, { dispatch, getState }, previousValue) => {
        const prevRec = Boolean(previousValue?.isRecordingRequested);
        const prevTrans = Boolean(previousValue?.isTranscribingEnabled);
        const curRec = Boolean(recordingMetadata?.isRecordingRequested);
        const curTrans = Boolean(recordingMetadata?.isTranscribingEnabled);

        const recordingStarting = !prevRec && curRec;
        const transcriptionStarting = !prevTrans && curTrans;
        const recordingStopping = prevRec && !curRec;
        const transcriptionStopping = prevTrans && !curTrans;

        if (recordingStarting || transcriptionStarting) {
            const existing = getState()['features/recording'].startRecordingIntent;

            if (!existing) {
                dispatch(setStartRecordingIntent({
                    recording: recordingStarting,
                    transcription: transcriptionStarting
                }));
            }
            maybeNotifyRecordingStart(dispatch, getState);
        }

        if (recordingStopping || transcriptionStopping) {
            const existing = getState()['features/recording'].stopRecordingIntent;

            if (!existing) {
                dispatch(setStopRecordingIntent({
                    recording: recordingStopping,
                    transcription: transcriptionStopping
                }));
            }
            maybeNotifyRecordingStop(dispatch, getState);
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
            // We receive 2 updates of the session status ON. The first one is from jibri when it joins.
            // The second one is from jicofo which will deliver the initiator value. Since the start
            // recording notification uses the initiator value we skip the jibri update and show the
            // notification on the update from jicofo.
            // FIXME: simplify checks when the backend start sending only one status ON update containing
            // the initiator.
            if (initiator && !oldSessionData?.initiator) {
                // Initiator just became known — let maybeNotifyRecordingStart
                // decide whether to emit the notification now. It reads the
                // initiator directly from sessionDatas and gates on its presence.
                maybeNotifyRecordingStart(dispatch, getState);
            }

            if (oldSessionData?.status !== ON) {
                sendAnalytics(createRecordingEvent('start', mode));

                if (mode === JitsiRecordingConstants.mode.STREAM) {
                    dispatch(playSound(LIVE_STREAMING_ON_SOUND_ID));
                }
                // FILE: no call here — handled by the initiator branch above with maybeNotifyRecordingStart.

                if (typeof APP !== 'undefined') {
                    APP.API.notifyRecordingStatusChanged(
                        true, mode, undefined, isRecorderTranscriptionsRunning(state));
                }
            }
        } else if (updatedSessionData?.status === OFF && oldSessionData?.status !== OFF) {
            let duration = 0;

            if (oldSessionData?.timestamp) {
                duration
                    = (Date.now() / 1000) - oldSessionData.timestamp;
            }
            sendAnalytics(createRecordingEvent('stop', mode, duration));

            if (mode === JitsiRecordingConstants.mode.FILE) {
                // Recording OFF is one of the resolution points — let the stop
                // coordinator decide which sound/notification to play based on
                // stopRecordingIntent (combined vs recording-only).
                maybeNotifyRecordingStop(dispatch, getState);
            } else if (mode === JitsiRecordingConstants.mode.STREAM) {
                const participantName = terminator
                    ? getParticipantDisplayName(state, getResourceId(terminator))
                    : undefined;

                dispatch(showStoppedRecordingNotification(mode, participantName, false));
                dispatch(stopSound(LIVE_STREAMING_ON_SOUND_ID));
                dispatch(playSound(LIVE_STREAMING_OFF_SOUND_ID));
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
