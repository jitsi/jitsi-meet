/* @flow */

import { CONFERENCE_WILL_JOIN } from '../base/conference';
import {
    JitsiConferenceEvents,
    JitsiRecordingConstants
} from '../base/lib-jitsi-meet';
import { MiddlewareRegistry } from '../base/redux';
import {
    playSound,
    registerSound,
    stopSound,
    unregisterSound
} from '../base/sounds';

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../app';

import { updateRecordingSessionData } from './actions';
import { RECORDING_SESSION_UPDATED } from './actionTypes';
import { RECORDING_OFF_SOUND_ID, RECORDING_ON_SOUND_ID } from './constants';
import { getSessionById } from './functions';
import {
    RECORDING_OFF_SOUND_FILE,
    RECORDING_ON_SOUND_FILE
} from './sounds';

/**
 * The redux middleware to handle the recorder updates in a React way.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    let oldSessionData;

    if (action.type === RECORDING_SESSION_UPDATED) {
        oldSessionData
            = getSessionById(store.getState(), action.sessionData.id);
    }

    const result = next(action);

    switch (action.type) {
    case APP_WILL_MOUNT:
        store.dispatch(registerSound(
            RECORDING_OFF_SOUND_ID,
            RECORDING_OFF_SOUND_FILE));

        store.dispatch(registerSound(
            RECORDING_ON_SOUND_ID,
            RECORDING_ON_SOUND_FILE));

        break;

    case APP_WILL_UNMOUNT:
        store.dispatch(unregisterSound(RECORDING_OFF_SOUND_ID));
        store.dispatch(unregisterSound(RECORDING_ON_SOUND_ID));

        break;

    case CONFERENCE_WILL_JOIN: {
        const { conference } = action;

        conference.on(
            JitsiConferenceEvents.RECORDER_STATE_CHANGED,
            recorderSession => {

                if (recorderSession && recorderSession.getID()) {
                    store.dispatch(
                        updateRecordingSessionData(recorderSession));

                    return;
                }
            });

        break;
    }

    case RECORDING_SESSION_UPDATED: {
        const updatedSessionData
            = getSessionById(store.getState(), action.sessionData.id);

        if (updatedSessionData.mode === JitsiRecordingConstants.mode.FILE) {
            const { OFF, ON } = JitsiRecordingConstants.status;

            if (updatedSessionData.status === ON
                && (!oldSessionData || oldSessionData.status !== ON)) {
                store.dispatch(playSound(RECORDING_ON_SOUND_ID));
            } else if (updatedSessionData.status === OFF
                && (!oldSessionData || oldSessionData.status !== OFF)) {
                store.dispatch(stopSound(RECORDING_ON_SOUND_ID));
                store.dispatch(playSound(RECORDING_OFF_SOUND_ID));
            }
        }

        break;
    }
    }

    return result;
});
