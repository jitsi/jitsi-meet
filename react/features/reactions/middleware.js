// @flow

import { CONFERENCE_JOINED } from '../base/conference';
import { MiddlewareRegistry } from '../base/redux';

import { addReceivedReaction } from './actions';

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONFERENCE_JOINED:
        return _conferenceJoined(store, next, action);
    }

    return next(action);
});

/**
 * Notifies the feature app that the action {@link CONFERENCE_JOINED} is being
 * dispatched within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code CONFERENCE_JOINED} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified {@code action}.
 */
function _conferenceJoined({ dispatch, getState }, next, action) {
    const result = next(action);

    getState()['features/base/conference'].conference.on(
        'conference.endpoint_message_received',
        (participant, message) => {
            let payload;

            if (message
                    && (payload = message.payload)
                    && payload.type === 'reaction') {
                dispatch(addReceivedReaction(payload.reaction, participant));
            }
        });

    return result;
}
