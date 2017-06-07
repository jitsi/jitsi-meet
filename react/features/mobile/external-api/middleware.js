/* @flow */

import { NativeModules } from 'react-native';

import { getInviteURL } from '../../base/connection';
import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT,
    CONFERENCE_WILL_JOIN,
    CONFERENCE_WILL_LEAVE
} from '../../base/conference';
import { MiddlewareRegistry } from '../../base/redux';


/**
 * Middleware that captures Redux actions and uses the ExternalAPI module to
 * turn them into native events so the application knows about them.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const eventData = {};

    switch (action.type) {
    case CONFERENCE_FAILED: {
        eventData.error = action.error;
        eventData.url = getInviteURL(store.getState());
        _sendEvent('CONFERENCE_FAILED', eventData);
        break;
    }

    case CONFERENCE_JOINED: {
        eventData.url = getInviteURL(store.getState());
        _sendEvent('CONFERENCE_JOINED', eventData);
        break;
    }

    case CONFERENCE_LEFT: {
        eventData.url = getInviteURL(store.getState());
        _sendEvent('CONFERENCE_LEFT', eventData);
        break;
    }

    case CONFERENCE_WILL_JOIN: {
        eventData.url = getInviteURL(store.getState());
        _sendEvent('CONFERENCE_WILL_JOIN', eventData);
        break;
    }

    case CONFERENCE_WILL_LEAVE: {
        eventData.url = getInviteURL(store.getState());
        _sendEvent('CONFERENCE_WILL_LEAVE', eventData);
        break;
    }

    }

    return next(action);
});

/**
 * Sends the given event to the native side of the application. Applications can
 * then listen to the events using the mechanisms provided by the Jitsi Meet
 * SDK.
 *
 * @param {string} name - Event name.
 * @param {Object} data - Ancillary data for the event.
 * @private
 * @returns {void}
 */
function _sendEvent(name: string, data: Object) {
    NativeModules.ExternalAPI.sendEvent(name, data);
}
