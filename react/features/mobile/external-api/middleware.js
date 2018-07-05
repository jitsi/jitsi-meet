// @flow

import { NativeModules } from 'react-native';

import { getAppProp } from '../../app';
import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT,
    CONFERENCE_WILL_JOIN,
    CONFERENCE_WILL_LEAVE
} from '../../base/conference';
import { MiddlewareRegistry } from '../../base/redux';
import {
    SESSION_ENDED,
    SESSION_FAILED,
    SESSION_STARTED,
    SESSION_WILL_END,
    SESSION_WILL_START,
    SET_SESSION
} from '../../base/session';
import { getSymbolDescription } from '../../base/util';
import { ENTER_PICTURE_IN_PICTURE } from '../picture-in-picture';

/**
 * FIXME.
 *
 * @param {Symbol} state - FIXME.
 * @returns {string}
 * @private
 */
function _stateToApiEventName(state) {
    switch (state) {
    case SESSION_WILL_START:
        return getSymbolDescription(CONFERENCE_WILL_JOIN);

    case SESSION_STARTED:
        return getSymbolDescription(CONFERENCE_JOINED);

    case SESSION_WILL_END:
        return getSymbolDescription(CONFERENCE_WILL_LEAVE);

    case SESSION_ENDED:
        return getSymbolDescription(CONFERENCE_LEFT);

    case SESSION_FAILED:
        return getSymbolDescription(CONFERENCE_FAILED);

    default:
        return undefined;
    }
}

import { sendEvent } from './functions';

/**
 * Middleware that captures Redux actions and uses the ExternalAPI module to
 * turn them into native events so the application knows about them.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    action.type && console.info(`ACTION ${getSymbolDescription(action.type)}`);

    const result = next(action);
    const { type } = action;

    switch (type) {
    case SET_SESSION:
        _setSession(store, action);
        break;

    case ENTER_PICTURE_IN_PICTURE:
        sendEvent(store, getSymbolDescription(type), /* data */ {});
        break;
    }

    return result;
});

/**
 * Returns a {@code String} representation of a specific error {@code Object}.
 *
 * @param {Error|Object|string} error - The error {@code Object} to return a
 * {@code String} representation of.
 * @returns {string} A {@code String} representation of the specified
 * {@code error}.
 */
function _toErrorString(
        error: Error | { message: ?string, name: ?string } | string) {
    // XXX In lib-jitsi-meet and jitsi-meet we utilize errors in the form of
    // strings, Error instances, and plain objects which resemble Error.
    return (
        error
            ? typeof error === 'string'
                ? error
                : Error.prototype.toString.apply(error)
            : '');
}

/**
 * Sends a specific event to the native counterpart of the External API. Native
 * apps may listen to such events via the mechanisms provided by the (native)
 * mobile Jitsi Meet SDK.
 *
 * @param {Object} store - The redux store.
 * @param {string} name - The name of the event to send.
 * @param {Object} data - The details/specifics of the event to send determined
 * by/associated with the specified {@code name}.
 * @private
 * @returns {void}
 */
function _sendEvent(store: Object, name: string, data: Object) {
    // The JavaScript App needs to provide uniquely identifying information to
    // the native ExternalAPI module so that the latter may match the former to
    // the native JitsiMeetView which hosts it.
    const externalAPIScope = getAppProp(store, 'externalAPIScope');

    console.info(
        `EXT EVENT ${name} URL: ${data.url} DATA: ${JSON.stringify(data)}`);

    externalAPIScope
        && NativeModules.ExternalAPI.sendEvent(name, data, externalAPIScope);
}

/**
 * FIXME.
 *
 * @param {Store} store - FIXME.
 * @param {Action} action - FIXME.
 * @returns {void}
 * @private
 */
function _setSession(store, action) {
    const { error, state, url } = action.session;
    const apiEventName = _stateToApiEventName(state);

    apiEventName && _sendEvent(
        store,
        apiEventName,
        /* data */ {
            url,
            error: error && _toErrorString(error)
        });
}
