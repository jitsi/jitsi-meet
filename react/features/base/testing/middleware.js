// @flow

import { CONFERENCE_WILL_JOIN } from '../conference';
import { JitsiConferenceEvents } from '../lib-jitsi-meet';
import { MiddlewareRegistry } from '../redux';

import { setConnectionState } from './actions';
import logger from './logger';

/**
 * The Redux middleware of the feature testing.
 *
 * @param {Store} store - The Redux store.
 * @returns {Function}
 * @private
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONFERENCE_WILL_JOIN:
        _bindConferenceConnectionListener(action.conference, store);
        break;
    }

    return next(action);
});

/**
 * Binds a handler which will listen for the connection related conference
 * events (in the lib-jitsi-meet internals those are associated with the ICE
 * connection state).
 *
 * @param {JitsiConference} conference - The {@link JitsiConference} for which
 * the conference will join even is dispatched.
 * @param {Store} store - The redux store in which the specified action is being
 * dispatched.
 * @private
 * @returns {void}
 */
function _bindConferenceConnectionListener(conference, { dispatch }) {

    conference.on(
        JitsiConferenceEvents.CONNECTION_ESTABLISHED,
        _onConnectionEvent.bind(
            null, JitsiConferenceEvents.CONNECTION_ESTABLISHED, dispatch));
    conference.on(
        JitsiConferenceEvents.CONNECTION_RESTORED,
        _onConnectionEvent.bind(
            null, JitsiConferenceEvents.CONNECTION_RESTORED, dispatch));
    conference.on(
        JitsiConferenceEvents.CONNECTION_INTERRUPTED,
        _onConnectionEvent.bind(
            null, JitsiConferenceEvents.CONNECTION_INTERRUPTED, dispatch));
}

/**
 * The handler function for conference connection events which wil store the
 * latest even name in the Redux store of feature testing.
 *
 * @param {string} event - One of the lib-jitsi-meet JitsiConferenceEvents.
 * @param {Function} dispatch - The dispatch function of the current Redux
 * store.
 * @returns {void}
 * @private
 */
function _onConnectionEvent(event, dispatch) {
    switch (event) {
    case JitsiConferenceEvents.CONNECTION_ESTABLISHED:
    case JitsiConferenceEvents.CONNECTION_INTERRUPTED:
    case JitsiConferenceEvents.CONNECTION_RESTORED:
        dispatch(setConnectionState(event));
        break;
    default:
        logger.error(`onConnectionEvent - unsupported event type: ${event}`);
        break;
    }
}

