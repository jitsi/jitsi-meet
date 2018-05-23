/* @flow */

import { CONFERENCE_WILL_JOIN } from '../base/conference';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { MiddlewareRegistry } from '../base/redux';

import { updateRecordingSessionData } from './actions';

/**
 * The redux middleware to handle the recorder updates in a React way.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(({ dispatch }) => next => action => {
    const result = next(action);

    switch (action.type) {
    case CONFERENCE_WILL_JOIN: {
        const { conference } = action;

        conference.on(
            JitsiConferenceEvents.RECORDER_STATE_CHANGED,
            recorderSession => {

                if (recorderSession && recorderSession.getID()) {
                    dispatch(
                        updateRecordingSessionData(recorderSession));

                    return;
                }
            });

        break;
    }
    }

    return result;
});
