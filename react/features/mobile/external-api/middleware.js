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
    case CONFERENCE_FAILED:
    case CONFERENCE_JOINED:
    case CONFERENCE_LEFT:
    case CONFERENCE_WILL_JOIN:
    case CONFERENCE_WILL_LEAVE: {
        const { conference, type, ...data } = action;

        // For the above (redux) actions, conference identifies a
        // JitsiConference instance. The external API cannot transport such an
        // object so we have to transport an "equivalent".
        if (conference) {
            data.url = toURLString(conference[JITSI_CONFERENCE_URL_KEY]);
        }

        _sendEvent(store, _getSymbolDescription(type), data);
        break;
    }

    case LOAD_CONFIG_ERROR: {
        const { error, locationURL, type } = action;

        _sendEvent(store, _getSymbolDescription(type), {
            error: String(error),
            url: toURLString(locationURL)
        });
        break;
    }
    }

    return result;
});

/**
 * Gets the description of a specific <tt>Symbol</tt>.
 *
 * @param {Symbol} symbol - The <tt>Symbol</tt> to retrieve the description of.
 * @private
 * @returns {string} The description of <tt>symbol</tt>.
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
 * Sends a specific event to the native counterpart of the External API. Native
 * apps may listen to such events via the mechanisms provided by the (native)
 * mobile Jitsi Meet SDK.
 *
 * @param {Object} store - The redux store associated with the need to send the
 * specified event.
 * @param {string} name - The name of the event to send.
 * @param {Object} data - The details/specifics of the event to send determined
 * by/associated with the specified {@code name}.
 * @private
 * @returns {void}
 */
function _sendEvent(store: Object, name: string, data: Object) {
    // The JavaScript App needs to provide uniquely identifying information
    // to the native ExternalAPI module so that the latter may match the former
    // to the native JitsiMeetView which hosts it.
    const state = store.getState();
    const { app } = state['features/app'];

    if (app) {
        const { externalAPIScope } = app.props;

        if (externalAPIScope) {
            NativeModules.ExternalAPI.sendEvent(name, data, externalAPIScope);
        }
    }
}
