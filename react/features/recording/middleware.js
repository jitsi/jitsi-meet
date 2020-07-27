/* @flow */


import {
    createRecordingEvent,
    sendAnalytics
} from '../analytics';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app';
import { CONFERENCE_WILL_JOIN, getCurrentConference } from '../base/conference';
import JitsiMeetJS, {
    JitsiConferenceEvents,
    JitsiRecordingConstants
} from '../base/lib-jitsi-meet';
import { getParticipantDisplayName } from '../base/participants';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';
import {
    playSound,
    registerSound,
    stopSound,
    unregisterSound
} from '../base/sounds';

import { RECORDING_SESSION_UPDATED } from './actionTypes';
import {
    clearRecordingSessions,
    hidePendingRecordingNotification,
    hideWaitingInQueueRecordingNotification,
    showPendingRecordingNotification,
    showQueueLeftRecordingNotification,
    showRecordingError,
    showRecordingLimitNotification,
    showStartedRecordingNotification,
    showStoppedRecordingNotification,
    showWaitingInQueueRecordingNotification,
    updateRecordingSessionData
} from './actions';
import {
    LIVE_STREAMING_OFF_SOUND_ID,
    LIVE_STREAMING_ON_SOUND_ID,
    RECORDING_OFF_SOUND_ID,
    RECORDING_ON_SOUND_ID
} from './constants';
import { getSessionById } from './functions';
import {
    LIVE_STREAMING_OFF_SOUND_FILE,
    LIVE_STREAMING_ON_SOUND_FILE,
    RECORDING_OFF_SOUND_FILE,
    RECORDING_ON_SOUND_FILE
} from './sounds';

declare var interfaceConfig: Object;

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
MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    let oldSessionData;

    if (action.type === RECORDING_SESSION_UPDATED) {
        oldSessionData
            = getSessionById(getState(), action.sessionData.id);
    }

    const result = next(action);

    switch (action.type) {
    case APP_WILL_MOUNT:
        dispatch(registerSound(
            LIVE_STREAMING_OFF_SOUND_ID,
            LIVE_STREAMING_OFF_SOUND_FILE));

        dispatch(registerSound(
            LIVE_STREAMING_ON_SOUND_ID,
            LIVE_STREAMING_ON_SOUND_FILE));

        dispatch(registerSound(
            RECORDING_OFF_SOUND_ID,
            RECORDING_OFF_SOUND_FILE));

        dispatch(registerSound(
            RECORDING_ON_SOUND_ID,
            RECORDING_ON_SOUND_FILE));

        break;

    case APP_WILL_UNMOUNT:
        dispatch(unregisterSound(LIVE_STREAMING_OFF_SOUND_ID));
        dispatch(unregisterSound(LIVE_STREAMING_ON_SOUND_ID));
        dispatch(unregisterSound(RECORDING_OFF_SOUND_ID));
        dispatch(unregisterSound(RECORDING_ON_SOUND_ID));

        break;

    case CONFERENCE_WILL_JOIN: {
        const { conference } = action;

        conference.on(
            JitsiConferenceEvents.RECORDER_STATE_CHANGED,
            recorderSession => {
                if (recorderSession) {
                    if (recorderSession.getID() || recorderSession.getQueueID()) {
                        dispatch(
                            updateRecordingSessionData(recorderSession));
                    }

                    if (recorderSession.getError()) {
                        _showRecordingErrorNotification(
                            recorderSession, dispatch);
                    }
                }

                return;
            });

        break;
    }

    case RECORDING_SESSION_UPDATED: {
        // When in recorder mode no notifications are shown
        // or extra sounds are also not desired
        // but we want to indicate those in case of sip gateway
        const {
            iAmRecorder,
            iAmSipGateway,
            disableRecordAudioNotification,
            recordingLimit
        } = getState()['features/base/config'];

        if (iAmRecorder && !iAmSipGateway) {
            break;
        }

        const updatedSessionData = getSessionById(getState(), action.sessionData.id);
        const { initiator, mode, status: newStatus, terminator } = updatedSessionData;
        const { PENDING, OFF, ON, WAITING_IN_QUEUE, QUEUE_LEFT } = JitsiRecordingConstants.status;

        if (oldSessionData && oldSessionData.status === newStatus) {
            return result;
        }

        if (newStatus !== WAITING_IN_QUEUE) {
            dispatch(hideWaitingInQueueRecordingNotification(mode));
        }

        if (newStatus !== PENDING) {
            dispatch(hidePendingRecordingNotification(mode));
        }

        switch (newStatus) {
        case WAITING_IN_QUEUE:
            dispatch(showWaitingInQueueRecordingNotification(mode));
            break;
        case QUEUE_LEFT:
            dispatch(showQueueLeftRecordingNotification(mode));
            break;
        case PENDING:
            dispatch(showPendingRecordingNotification(mode));
            break;
        case ON: {
            if (initiator) {
                const initiatorName = initiator && getParticipantDisplayName(getState, initiator.getId());

                initiatorName && dispatch(showStartedRecordingNotification(mode, initiatorName));
            } else if (typeof recordingLimit === 'object') {
                // Show notification with additional information to the initiator.
                dispatch(showRecordingLimitNotification(mode));
            }


            sendAnalytics(createRecordingEvent('start', mode));

            if (disableRecordAudioNotification) {
                return result;
            }

            let soundID;

            if (mode === JitsiRecordingConstants.mode.FILE) {
                soundID = RECORDING_ON_SOUND_ID;
            } else if (mode === JitsiRecordingConstants.mode.STREAM) {
                soundID = LIVE_STREAMING_ON_SOUND_ID;
            }

            if (soundID) {
                dispatch(playSound(soundID));
            }
            break;
        }
        case OFF: {
            dispatch(showStoppedRecordingNotification(
                mode, terminator && getParticipantDisplayName(getState, terminator.getId())));
            let duration = 0, soundOff, soundOn;

            if (oldSessionData && oldSessionData.timestamp) {
                duration
                    = (Date.now() / 1000) - oldSessionData.timestamp;
            }
            sendAnalytics(createRecordingEvent('stop', mode, duration));

            if (disableRecordAudioNotification) {
                return result;
            }

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
            break;
        }
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
function _showRecordingErrorNotification(recorderSession, dispatch) {
    const isStreamMode
        = recorderSession.getMode()
            === JitsiMeetJS.constants.recording.mode.STREAM;

    switch (recorderSession.getError()) {
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
}
