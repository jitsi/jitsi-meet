import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';

import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT
} from '../base/conference';
import { MiddlewareRegistry } from '../base/redux';

import { updateTranscriptionState } from './actions';

/**
 * Middleware that captures conference actions and adds a listener to
 * transcription status events.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case CONFERENCE_JOINED: {
        const { conference } = action;

        conference && conference.on(
            JitsiConferenceEvents.TRANSCRIPTION_STATUS_CHANGED,
            (...args) => store.dispatch(updateTranscriptionState(...args)));

        break;
    }

    case CONFERENCE_FAILED:
    case CONFERENCE_LEFT:
        // REMOVE THE LISTENER?
        break;
    }

    return result;
});
