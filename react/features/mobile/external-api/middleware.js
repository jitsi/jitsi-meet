/* @flow */

import { NativeModules } from 'react-native';

import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT,
    CONFERENCE_WILL_JOIN,
    CONFERENCE_WILL_LEAVE,
    JITSI_CONFERENCE_URL_KEY
} from '../../base/conference';
import { LOAD_CONFIG_ERROR } from '../../base/config';
import { MiddlewareRegistry } from '../../base/redux';
import { toURLString } from '../../base/util';
import { ENTER_PICTURE_IN_PICTURE } from '../picture-in-picture';

/**
 * Middleware that captures Redux actions and uses the ExternalAPI module to
 * turn them into native events so the application knows about them.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case CONFERENCE_FAILED: {
        const { error, ...data } = action;

        // XXX Certain CONFERENCE_FAILED errors are recoverable i.e. they have
        // prevented the user from joining a specific conference but the app may
        // be able to eventually join the conference. For example, the app will
        // ask the user for a password upon
        // JitsiConferenceErrors.PASSWORD_REQUIRED and will retry joining the
        // conference afterwards. Such errors are to not reach the native
        // counterpart of the External API (or at least not in the
        // fatality/finality semantics attributed to
        // conferenceFailed:/onConferenceFailed).
        if (!error.recoverable) {
            _sendConferenceEvent(store, /* action */ {
                error: _toErrorString(error),
                ...data
            });
        }
        break;
    }

    case CONFERENCE_JOINED:
    case CONFERENCE_LEFT:
    case CONFERENCE_WILL_JOIN:
    case CONFERENCE_WILL_LEAVE:
        _sendConferenceEvent(store, action);
        break;

    case ENTER_PICTURE_IN_PICTURE:
        _sendEvent(store, _getSymbolDescription(action.type), /* data */ {});
        break;

    case LOAD_CONFIG_ERROR: {
        const { error, locationURL, type } = action;

        _sendEvent(store, _getSymbolDescription(type), /* data */ {
            error: _toErrorString(error),
            url: toURLString(locationURL)
        });
        break;
    }
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
 * Gets the description of a specific {@code Symbol}.
 *
 * @param {Symbol} symbol - The {@code Symbol} to retrieve the description of.
 * @private
 * @returns {string} The description of {@code symbol}.
 */
function _getSymbolDescription(symbol: Symbol) {
    let description = symbol.toString();

    if (description.startsWith('Symbol(') && description.endsWith(')')) {
        description = description.slice(7, -1);
    }

    // The polyfill es6-symbol that we use does not appear to comply with the
    // Symbol standard and, merely, adds @@ at the beginning of the description.
    if (description.startsWith('@@')) {
        description = description.slice(2);
    }

    return description;
}

/**
 * Sends an event to the native counterpart of the External API for a specific
 * conference-related redux action.
 *
 * @param {Store} store - The redux store.
 * @param {Action} action - The redux action.
 * @returns {void}
 */
function _sendConferenceEvent(
        store: Object,
        action: {
            conference: Object,
            type: Symbol,
            url: ?string
        }) {
    const { conference, type, ...data } = action;

    // For these (redux) actions, conference identifies a JitsiConference
    // instance. The external API cannot transport such an object so we have to
    // transport an "equivalent".
    if (conference) {
        data.url = toURLString(conference[JITSI_CONFERENCE_URL_KEY]);
    }

    _swallowEvent(store, action, data)
        || _sendEvent(store, _getSymbolDescription(type), data);
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
function _sendEvent(
        { getState }: { getState: Function },
        name: string,
        data: Object) {
    // The JavaScript App needs to provide uniquely identifying information
    // to the native ExternalAPI module so that the latter may match the former
    // to the native JitsiMeetView which hosts it.
    const { app } = getState()['features/app'];

    if (app) {
        const { externalAPIScope } = app.props;

        if (externalAPIScope) {
            NativeModules.ExternalAPI.sendEvent(name, data, externalAPIScope);
        }
    }
}

/**
 * Determines whether to not send a {@code CONFERENCE_LEFT} event to the native
 * counterpart of the External API.
 *
 * @param {Object} store - The redux store.
 * @param {Action} action - The redux action which is causing the sending of the
 * event.
 * @param {Object} data - The details/specifics of the event to send determined
 * by/associated with the specified {@code action}.
 * @returns {boolean} If the specified event is to not be sent, {@code true};
 * otherwise, {@code false}.
 */
function _swallowConferenceLeft({ getState }, action, { url }) {
    // XXX Internally, we work with JitsiConference instances. Externally
    // though, we deal with URL strings. The relation between the two is many to
    // one so it's technically and practically possible (by externally loading
    // the same URL string multiple times) to try to send CONFERENCE_LEFT
    // externally for a URL string which identifies a JitsiConference that the
    // app is internally legitimately working with.

    if (url) {
        const stateFeaturesBaseConference
            = getState()['features/base/conference'];

        // eslint-disable-next-line guard-for-in
        for (const p in stateFeaturesBaseConference) {
            const v = stateFeaturesBaseConference[p];

            // Does the value of the base/conference's property look like a
            // JitsiConference?
            if (v && typeof v === 'object') {
                const vURL = v[JITSI_CONFERENCE_URL_KEY];

                if (vURL && vURL.toString() === url) {
                    return true;
                }
            }
        }
    }

    return false;
}

/**
 * Determines whether to not send a specific event to the native counterpart of
 * the External API.
 *
 * @param {Object} store - The redux store.
 * @param {Action} action - The redux action which is causing the sending of the
 * event.
 * @param {Object} data - The details/specifics of the event to send determined
 * by/associated with the specified {@code action}.
 * @returns {boolean} If the specified event is to not be sent, {@code true};
 * otherwise, {@code false}.
 */
function _swallowEvent(store, action, data) {
    switch (action.type) {
    case CONFERENCE_LEFT:
        return _swallowConferenceLeft(store, action, data);

    default:
        return false;
    }
}
