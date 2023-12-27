import { createRecordingEvent } from '../analytics/AnalyticsEvents';
import { sendAnalytics } from '../analytics/functions';
import { IStore } from '../app/types';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app/actionTypes';
import { CONFERENCE_JOIN_IN_PROGRESS } from '../base/conference/actionTypes';
import { getCurrentConference } from '../base/conference/functions';
import JitsiMeetJS, {
    JitsiConferenceEvents,
    JitsiRecordingConstants
} from '../base/lib-jitsi-meet';
import { MEDIA_TYPE } from '../base/media/constants';
import { updateLocalRecordingStatus } from '../base/participants/actions';
import { getParticipantDisplayName } from '../base/participants/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import {
    playSound,
    stopSound
} from '../base/sounds/actions';
import { TRACK_ADDED } from '../base/tracks/actionTypes';
import { showErrorNotification, showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import { RECORDING_SESSION_UPDATED, START_LOCAL_RECORDING, STOP_LOCAL_RECORDING } from './actionTypes';
import {
    clearRecordingSessions,
    hidePendingRecordingNotification,
    showPendingRecordingNotification,
    showRecordingError,
    showRecordingLimitNotification,
    showRecordingWarning,
    showStartedRecordingNotification,
    showStoppedRecordingNotification,
    updateRecordingSessionData
} from './actions';
import LocalRecordingManager from './components/Recording/LocalRecordingManager';
import {
    LIVE_STREAMING_OFF_SOUND_ID,
    LIVE_STREAMING_ON_SOUND_ID,
    RECORDING_OFF_SOUND_ID,
    RECORDING_ON_SOUND_ID
} from './constants';
import {
    getResourceId,
    getSessionById,
    registerRecordingAudioFiles,
    unregisterRecordingAudioFiles
} from './functions';
import logger from './logger';

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
 * The redux middleware to handle the recorder updates in a React way.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(({ dispatch, getState }) => next => async action => {
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
                    recorderSession.getError() && _showRecordingErrorNotification(recorderSession, dispatch);
                }

                return;
            });

        break;
    }

    case START_LOCAL_RECORDING: {
        const { localRecording } = getState()['features/base/config'];
        const { onlySelf } = action;

        try {
            await LocalRecordingManager.startLocalRecording({ dispatch,
                getState }, action.onlySelf);
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
                APP.API.notifyRecordingStatusChanged(true, 'local');
            }
        } catch (err: any) {
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
                APP.API.notifyRecordingStatusChanged(false, 'local', err.message);
            }

            dispatch(showErrorNotification(props, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
        }
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
                APP.API.notifyRecordingStatusChanged(false, 'local');
            }
        }
        break;
    }

    case RECORDING_SESSION_UPDATED: {
        // When in recorder mode no notifications are shown
        // or extra sounds are also not desired
        // but we want to indicate those in case of sip gateway
        const {
            iAmRecorder,
            iAmSipGateway,
            recordingLimit
        } = getState()['features/base/config'];

        if (iAmRecorder && !iAmSipGateway) {
            break;
        }

        const updatedSessionData
            = getSessionById(getState(), action.sessionData.id);
        const { initiator, mode = '', terminator } = updatedSessionData ?? {};
        const { PENDING, OFF, ON } = JitsiRecordingConstants.status;

        if (updatedSessionData?.status === PENDING
            && (!oldSessionData || oldSessionData.status !== PENDING)) {
            dispatch(showPendingRecordingNotification(mode));
        } else if (updatedSessionData?.status !== PENDING) {
            dispatch(hidePendingRecordingNotification(mode));

            if (updatedSessionData?.status === ON) {

                // We receive 2 updates of the session status ON. The first one is from jibri when it joins.
                // The second one is from jicofo which will deliever the initiator value. Since the start
                // recording notification uses the initiator value we skip the jibri update and show the
                // notification on the update from jicofo.
                // FIXE: simplify checks when the backend start sending only one status ON update containing the
                // initiator.
                if (initiator && !oldSessionData?.initiator) {
                    if (typeof recordingLimit === 'object') {
                        dispatch(showRecordingLimitNotification(mode));
                    } else {
                        dispatch(showStartedRecordingNotification(mode, initiator, action.sessionData.id));
                    }
                }
                if (!oldSessionData || oldSessionData.status !== ON) {
                    sendAnalytics(createRecordingEvent('start', mode));

                    let soundID;

                    if (mode === JitsiRecordingConstants.mode.FILE) {
                        soundID = RECORDING_ON_SOUND_ID;
                    } else if (mode === JitsiRecordingConstants.mode.STREAM) {
                        soundID = LIVE_STREAMING_ON_SOUND_ID;
                    }

                    if (soundID) {
                        dispatch(playSound(soundID));
                    }

                    if (typeof APP !== 'undefined') {
                        APP.API.notifyRecordingStatusChanged(true, mode);
                    }
                }
            } else if (updatedSessionData?.status === OFF
                && (!oldSessionData || oldSessionData.status !== OFF)) {
                if (terminator) {
                    dispatch(
                        showStoppedRecordingNotification(
                            mode, getParticipantDisplayName(getState, getResourceId(terminator))));
                }

                let duration = 0, soundOff, soundOn;

                if (oldSessionData?.timestamp) {
                    duration
                        = (Date.now() / 1000) - oldSessionData.timestamp;
                }
                sendAnalytics(createRecordingEvent('stop', mode, duration));

                if (mode === JitsiRecordingConstants.mode.FILE) {
                    soundOff = RECORDING_OFF_SOUND_ID;
                    soundOn = RECORDING_ON_SOUND_ID;
                } else if (mode === JitsiRecordingConstants.mode.STREAM) {
                    soundOff = LIVE_STREAMING_OFF_SOUND_ID;
                    soundOn = LIVE_STREAMING_ON_SOUND_ID;
                }

                if (soundOff && soundOn) {
                    dispatch(stopSound(soundOn));
                    dispatch(playSound(soundOff));
                }

                if (typeof APP !== 'undefined') {
                    APP.API.notifyRecordingStatusChanged(false, mode);
                }
            }
        }

        break;
    }
    case TRACK_ADDED: {
        const { track } = action;

        if (LocalRecordingManager.isRecordingLocally() && track.mediaType === MEDIA_TYPE.AUDIO) {
            const audioTrack = track.jitsiTrack.track;

            LocalRecordingManager.addAudioTrackToLocalRecording(audioTrack);
        }
        break;
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
 * @param {Object} recorderSession - The recorder session model from the
 * lib.
 * @param {Dispatch} dispatch - The Redux Dispatch function.
 * @returns {void}
 */
function _showRecordingErrorNotification(recorderSession: any, dispatch: IStore['dispatch']) {
    const mode = recorderSession.getMode();
    const error = recorderSession.getError();
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
        APP.API.notifyRecordingStatusChanged(false, mode, error);
    }
}
