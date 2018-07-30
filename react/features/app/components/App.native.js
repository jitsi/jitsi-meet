// @flow

import React from 'react';
import { Linking } from 'react-native';

import '../../analytics';
import '../../authentication';
import '../../base/jwt';
import { Platform } from '../../base/react';
import {
    AspectRatioDetector,
    ReducedUIDetector
} from '../../base/responsive-ui';
import '../../mobile/audio-mode';
import '../../mobile/background';
import '../../mobile/callkit';
import '../../mobile/external-api';
import '../../mobile/full-screen';
import '../../mobile/permissions';
import '../../mobile/picture-in-picture';
import '../../mobile/proximity';
import '../../mobile/wake-lock';

import { AbstractApp } from './AbstractApp';
import type { Props as AbstractAppProps } from './AbstractApp';

declare var __DEV__;

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * The type of React {@code Component} props of {@link App}.
 */
type Props = AbstractAppProps & {

    /**
     * Whether the add people feature is enabled.
     */
    addPeopleEnabled: boolean,

    /**
     * Whether the dial-out feature is enabled.
     */
    dialOutEnabled: boolean,

    /**
     * Whether Picture-in-Picture is enabled. If {@code true}, a toolbar button
     * is rendered in the {@link Conference} view to afford entering
     * Picture-in-Picture.
     */
    pictureInPictureEnabled: boolean,

    /**
     * Whether the Welcome page is enabled. If {@code true}, the Welcome page is
     * rendered when the {@link App} is not at a location (URL) identifying
     * a Jitsi Meet conference/room.
     */
    welcomePageEnabled: boolean
};

/**
 * Root app {@code Component} on mobile/React Native.
 *
 * @extends AbstractApp
 */
export class App extends AbstractApp {
    /**
     * Initializes a new {@code App} instance.
     *
     * @param {Props} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onLinkingURL = this._onLinkingURL.bind(this);

        // In the Release configuration, React Native will (intentionally) throw
        // an unhandled JavascriptException for an unhandled JavaScript error.
        // This will effectively kill the app. In accord with the Web, do not
        // kill the app.
        this._maybeDisableExceptionsManager();
    }

    /**
     * Subscribe to notifications about activating URLs registered to be handled
     * by this app.
     *
     * @inheritdoc
     * @returns {void}
     * @see https://facebook.github.io/react-native/docs/linking.html
     */
    componentWillMount() {
        super.componentWillMount();

        Linking.addEventListener('url', this._onLinkingURL);
    }

    /**
     * Unsubscribe from notifications about activating URLs registered to be
     * handled by this app.
     *
     * @inheritdoc
     * @returns {void}
     * @see https://facebook.github.io/react-native/docs/linking.html
     */
    componentWillUnmount() {
        Linking.removeEventListener('url', this._onLinkingURL);

        super.componentWillUnmount();
    }

    /**
     * Injects {@link AspectRatioDetector} in order to detect the aspect ratio
     * of this {@code App}'s user interface and afford {@link AspectRatioAware}.
     *
     * @override
     */
    _createMainElement(component, props) {
        return (
            <AspectRatioDetector>
                <ReducedUIDetector>
                    { super._createMainElement(component, props) }
                </ReducedUIDetector>
            </AspectRatioDetector>
        );
    }

    /**
     * Attempts to disable the use of React Native
     * {@link ExceptionsManager#handleException} on platforms and in
     * configurations on/in which the use of the method in questions has been
     * determined to be undesirable. For example, React Native will
     * (intentionally) throw an unhandled {@code JavascriptException} for an
     * unhandled JavaScript error in the Release configuration. This will
     * effectively kill the app. In accord with the Web, do not kill the app.
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
            // errors/exceptions which were observed to kill the app. The
            // solution implemented bellow was tested on Android only so it is
            // considered safest to use it there only.
            return;
        }

        const oldHandler = global.ErrorUtils.getGlobalHandler();
        const newHandler = _handleException;

        if (!oldHandler || oldHandler !== newHandler) {
            newHandler.next = oldHandler;
            global.ErrorUtils.setGlobalHandler(newHandler);
        }
    }

    _onLinkingURL: (*) => void;

    /**
     * Notified by React's Linking API that a specific URL registered to be
     * handled by this app was activated.
     *
     * @param {Object} event - The details of the notification/event.
     * @param {string} event.url - The URL registered to be handled by this app
     * which was activated.
     * @private
     * @returns {void}
     */
    _onLinkingURL({ url }) {
        super._openURL(url);
    }
}

/**
 * Handles a (possibly unhandled) JavaScript error by preventing React Native
 * from converting a fatal error into an unhandled native exception which will
 * kill the app.
 *
 * @param {Error} error - The (possibly unhandled) JavaScript error to handle.
 * @param {boolean} fatal - If the specified error is fatal, {@code true};
 * otherwise, {@code false}.
 * @private
 * @returns {void}
 */
function _handleException(error, fatal) {
    if (fatal) {
        // In the Release configuration, React Native will (intentionally) throw
        // an unhandled JavascriptException for an unhandled JavaScript error.
        // This will effectively kill the app. In accord with the Web, do not
        // kill the app.
        logger.error(error);
    } else {
        // Forward to the next globalHandler of ErrorUtils.
        const { next } = _handleException;

        typeof next === 'function' && next(error, fatal);
    }
}
