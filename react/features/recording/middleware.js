/* @flow */

import {
    createRecordingEvent,
    sendAnalytics
} from '../analytics';
import { CONFERENCE_WILL_JOIN, getCurrentConference } from '../base/conference';
import JitsiMeetJS, {
    JitsiConferenceEvents,
    JitsiRecordingConstants
} from '../base/lib-jitsi-meet';
import { getParticipantDisplayName } from '../base/participants';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';

import { RECORDING_SESSION_UPDATED } from './actionTypes';
import {
    clearRecordingSessions,
    hidePendingRecordingNotification,
    showPendingRecordingNotification,
    showRecordingError,
    showRecordingLimitNotification,
    showStartedRecordingNotification,
    showStoppedRecordingNotification,
    updateRecordingSessionData
} from './actions';
import { getSessionById } from './functions';

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

        const updatedSessionData
            = getSessionById(getState(), action.sessionData.id);
        const { initiator, mode, terminator } = updatedSessionData;
        const { PENDING, OFF, ON } = JitsiRecordingConstants.status;

        if (updatedSessionData.status === PENDING
            && (!oldSessionData || oldSessionData.status !== PENDING)) {
            dispatch(showPendingRecordingNotification(mode));
        } else if (updatedSessionData.status !== PENDING) {
            dispatch(hidePendingRecordingNotification(mode));

            if (updatedSessionData.status === ON
                && (!oldSessionData || oldSessionData.status !== ON)) {
                if (initiator) {
                    const initiatorName = initiator && getParticipantDisplayName(getState, initiator.getId());

                    initiatorName && dispatch(showStartedRecordingNotification(mode, initiatorName));
                } else if (typeof recordingLimit === 'object') {
                    // Show notification with additional information to the initiator.
                    dispatch(showRecordingLimitNotification(mode));
                }


                sendAnalytics(createRecordingEvent('start', mode));

                if (disableRecordAudioNotification) {
                    break;
                }

            } else if (updatedSessionData.status === OFF
                && (!oldSessionData || oldSessionData.status !== OFF)) {
                dispatch(showStoppedRecordingNotification(
                    mode, terminator && getParticipantDisplayName(getState, terminator.getId())));
                let duration = 0;

                if (oldSessionData && oldSessionData.timestamp) {
                    duration
                        = (Date.now() / 1000) - oldSessionData.timestamp;
                }
                sendAnalytics(createRecordingEvent('stop', mode, duration));

                if (disableRecordAudioNotification) {
                    break;
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
