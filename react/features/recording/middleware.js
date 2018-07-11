/* @flow */

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app';
import { CONFERENCE_WILL_JOIN, getCurrentConference } from '../base/conference';
import JitsiMeetJS, {
    JitsiConferenceEvents,
    JitsiRecordingConstants
} from '../base/lib-jitsi-meet';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';
import {
    playSound,
    registerSound,
    stopSound,
    unregisterSound
} from '../base/sounds';

import {
    clearRecordingSessions,
    hidePendingRecordingNotification,
    showPendingRecordingNotification,
    showRecordingError,
    showStoppedRecordingNotification,
    updateRecordingSessionData
} from './actions';
import { RECORDING_SESSION_UPDATED } from './actionTypes';
import { RECORDING_OFF_SOUND_ID, RECORDING_ON_SOUND_ID } from './constants';
import { getSessionById } from './functions';
import {
    RECORDING_OFF_SOUND_FILE,
    RECORDING_ON_SOUND_FILE
} from './sounds';

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
            RECORDING_OFF_SOUND_ID,
            RECORDING_OFF_SOUND_FILE));

        dispatch(registerSound(
            RECORDING_ON_SOUND_ID,
            RECORDING_ON_SOUND_FILE));

        break;

    case APP_WILL_UNMOUNT:
        dispatch(unregisterSound(RECORDING_OFF_SOUND_ID));
        dispatch(unregisterSound(RECORDING_ON_SOUND_ID));

        break;

    case CONFERENCE_WILL_JOIN: {
        const { conference } = action;

        conference.on(
            JitsiConferenceEvents.RECORDER_STATE_CHANGED,
            recorderSession => {

                if (recorderSession) {
                    recorderSession.getID()
                        && dispatch(
                            updateRecordingSessionData(recorderSession));

                    recorderSession.getError()
                        && _showRecordingErrorNotification(
                            recorderSession, dispatch);
                }

                return;
            });

        break;
    }

    case RECORDING_SESSION_UPDATED: {
        const updatedSessionData
            = getSessionById(getState(), action.sessionData.id);
        const { PENDING, OFF, ON } = JitsiRecordingConstants.status;

        if (updatedSessionData.status === PENDING
            && (!oldSessionData || oldSessionData.status !== PENDING)) {
            dispatch(
                showPendingRecordingNotification(updatedSessionData.mode));
        } else if (updatedSessionData.status !== PENDING) {
            dispatch(
                hidePendingRecordingNotification(updatedSessionData.mode));

            if (updatedSessionData.status === ON
                && (!oldSessionData || oldSessionData.status !== ON)
                && updatedSessionData.mode
                    === JitsiRecordingConstants.mode.FILE) {
                dispatch(playSound(RECORDING_ON_SOUND_ID));
            } else if (updatedSessionData.status === OFF
                && (!oldSessionData || oldSessionData.status !== OFF)) {
                dispatch(
                    showStoppedRecordingNotification(
                        updatedSessionData.mode));

                if (updatedSessionData.mode
                        === JitsiRecordingConstants.mode.FILE) {
                    dispatch(stopSound(RECORDING_ON_SOUND_ID));
                    dispatch(playSound(RECORDING_OFF_SOUND_ID));
                }
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
                    ? 'Live Streaming service'
                    : 'Recording service'
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
