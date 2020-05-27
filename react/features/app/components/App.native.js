// @flow

import React from 'react';

import '../../analytics';
import '../../authentication';
import { setColorScheme } from '../../base/color-scheme';
import { DialogContainer } from '../../base/dialog';
import { CALL_INTEGRATION_ENABLED, updateFlags } from '../../base/flags';
import '../../base/jwt';
import { Platform } from '../../base/react';
import '../../base/responsive-ui';
import { updateSettings } from '../../base/settings';
import '../../google-api';
import '../../mobile/audio-mode';
import '../../mobile/back-button';
import '../../mobile/background';
import '../../mobile/call-integration';
import '../../mobile/external-api';
import '../../mobile/full-screen';
import '../../mobile/permissions';
import '../../mobile/picture-in-picture';
import '../../mobile/proximity';
import '../../mobile/wake-lock';
import '../../mobile/watchos';
import logger from '../logger';

import { AbstractApp } from './AbstractApp';
import type { Props as AbstractAppProps } from './AbstractApp';

declare var __DEV__;

/**
 * The type of React {@code Component} props of {@link App}.
 */
type Props = AbstractAppProps & {

    /**
     * An object of colors that override the default colors of the app/sdk.
     */
    colorScheme: ?Object,

    /**
     * Identifier for this app on the native side.
     */
    externalAPIScope: string,

    /**
     * An object with the feature flags.
     */
    flags: Object,

    /**
     * An object with user information (display name, email, avatar URL).
     */
    userInfo: ?Object
};

/**
 * Root app {@code Component} on mobile/React Native.
 *
 * @extends AbstractApp
 */
export class App extends AbstractApp {
    _init: Promise<*>;

    /**
     * Initializes a new {@code App} instance.
     *
     * @param {Props} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // In the Release configuration, React Native will (intentionally) throw
        // an unhandled JavascriptException for an unhandled JavaScript error.
        // This will effectively kill the app. In accord with the Web, do not
        // kill the app.
        this._maybeDisableExceptionsManager();
    }

    /**
     * Initializes the color scheme.
     *
     * @inheritdoc
     *
     * @returns {void}
     */
    componentDidMount() {
        super.componentDidMount();

        this._init.then(() => {
            // We set these early enough so then we avoid any unnecessary re-renders.
            const { dispatch } = this.state.store;

            dispatch(setColorScheme(this.props.colorScheme));
            dispatch(updateFlags(this.props.flags));
            dispatch(updateSettings(this.props.userInfo || {}));

            // Update settings with feature-flag.
            const callIntegrationEnabled = this.props.flags[CALL_INTEGRATION_ENABLED];

            if (typeof callIntegrationEnabled !== 'undefined') {
                dispatch(updateSettings({ disableCallIntegration: !callIntegrationEnabled }));
            }
        });
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

    /**
     * Renders the platform specific dialog container.
     *
     * @returns {React$Element}
     */
    _renderDialogContainer() {
        return (
            <DialogContainer />
        );
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
