/* global __DEV__ */

import React from 'react';

import '../../analytics';
import '../../authentication';
import { Platform } from '../../base/react';
import '../../mobile/audio-mode';
import '../../mobile/background';
import '../../mobile/callkit';
import '../../mobile/external-api';
import '../../mobile/full-screen';
import '../../mobile/permissions';
import '../../mobile/proximity';
import '../../mobile/wake-lock';
import '../../mobile/watchos';


import { AbstractApp } from './AbstractApp';

/**
 * Root application component.
 *
 * @extends AbstractApp
 */
export class App extends AbstractApp {
    /**
     * App component's property types.
     *
     * @static
     */
    static propTypes = {
        ...AbstractApp.propTypes,

        /**
         * Whether the Welcome page is enabled. If {@code true}, the Welcome
         * page is rendered when the {@link App} is not at a location (URL)
         * identifying a Jitsi Meet conference/room.
         */
        welcomePageEnabled: React.PropTypes.bool
    };

    /**
     * Initializes a new App instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // In the Release configuration, React Native will (intentionally) throw
        // an unhandled JavascriptException for an unhandled JavaScript error.
        // This will effectively kill the application. In accord with the Web,
        // do not kill the application.
        this._maybeDisableExceptionsManager();
    }

    /**
     * Attempts to disable the use of React Native
     * {@link ExceptionsManager#handleException} on platforms and in
     * configurations on/in which the use of the method in questions has been
     * determined to be undesirable. For example, React Native will
     * (intentionally) throw an unhandled JavascriptException for an
     * unhandled JavaScript error in the Release configuration. This will
     * effectively kill the application. In accord with the Web, do not kill the
     * application.
     *
     * @private
     * @returns {void}
     */
    _maybeDisableExceptionsManager() {
        if (__DEV__) {
            // As mentioned above, only the Release configuration was observed
            // to suffer.
            return;
        }
        if (Platform.OS !== 'android') {
            // A solution based on RTCSetFatalHandler was implemented on iOS and
            // it is preferred because it is at a later step of the
            // error/exception handling and it is specific to fatal
            // errors/exceptions which were observed to kill the application.
            // The solution implemented bellow was tested on Android only so it
            // is considered safest to use it there only.
            return;
        }

        const oldHandler = global.ErrorUtils.getGlobalHandler();
        const newHandler = _handleException;

        if (!oldHandler || oldHandler !== newHandler) {
            newHandler.next = oldHandler;
            global.ErrorUtils.setGlobalHandler(newHandler);
        }
    }
}

/**
 * Handles a (possibly unhandled) JavaScript error by preventing React Native
 * from converting a fatal error into an unhandled native exception which will
 * kill the application.
 *
 * @param {Error} error - The (possibly unhandled) JavaScript error to handle.
 * @param {boolean} fatal - True if the specified error is fatal; otherwise,
 * false.
 * @private
 * @returns {void}
 */
function _handleException(error, fatal) {
    if (fatal) {
        // In the Release configuration, React Native will (intentionally) throw
        // an unhandled JavascriptException for an unhandled JavaScript error.
        // This will effectively kill the application. In accord with the Web,
        // do not kill the application.
        console.error(error);
    } else {
        // Forward to the next globalHandler of ErrorUtils.
        const next = _handleException.next;

        typeof next === 'function' && next(error, fatal);
    }
}
