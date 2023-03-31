import React from 'react';
import { NativeModules, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SplashScreen from 'react-native-splash-screen';

import BottomSheetContainer from '../../base/dialog/components/native/BottomSheetContainer';
import DialogContainer from '../../base/dialog/components/native/DialogContainer';
import { updateFlags } from '../../base/flags/actions';
import { CALL_INTEGRATION_ENABLED, SERVER_URL_CHANGE_ENABLED } from '../../base/flags/constants';
import { getFeatureFlag } from '../../base/flags/functions';
import { clientResized, setSafeAreaInsets } from '../../base/responsive-ui/actions';
import DimensionsDetector from '../../base/responsive-ui/components/DimensionsDetector.native';
import { updateSettings } from '../../base/settings/actions';
import { _getRouteToRender } from '../getRouteToRender.native';
import logger from '../logger';

import { AbstractApp } from './AbstractApp';
import type { Props as AbstractAppProps } from './AbstractApp';

// Register middlewares and reducers.
import '../middlewares';
import '../reducers';

declare var __DEV__;

const { AppInfo } = NativeModules;

const DialogContainerWrapper = Platform.select({
    default: View
});

/**
 * The type of React {@code Component} props of {@link App}.
 */
type Props = AbstractAppProps & {

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
 * @augments AbstractApp
 */
export class App extends AbstractApp {
    /**
     * The deferred for the initialisation {{promise, resolve, reject}}.
     */
    _init: Object;

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

        // Bind event handler so it is only bound once per instance.
        this._onDimensionsChanged = this._onDimensionsChanged.bind(this);
        this._onSafeAreaInsetsChanged = this._onSafeAreaInsetsChanged.bind(this);
    }

    /**
     * Initializes the color scheme.
     *
     * @inheritdoc
     *
     * @returns {void}
     */
    async componentDidMount() {
        await super.componentDidMount();

        SplashScreen.hide();

        const liteTxt = AppInfo.isLiteSDK ? ' (lite)' : '';

        logger.info(`Loaded SDK ${AppInfo.sdkVersion}${liteTxt}`);
    }

    /**
     * Initializes feature flags and updates settings.
     *
     * @returns {void}
     */
    async _extraInit() {
        const { dispatch, getState } = this.state.store;

        // We set these early enough so then we avoid any unnecessary re-renders.
        dispatch(updateFlags(this.props.flags));

        const route = await _getRouteToRender();

        // We need the root navigator to be set early.
        await this._navigate(route);

        // HACK ALERT!
        // Wait until the root navigator is ready.
        // We really need to break the inheritance relationship between App,
        // AbstractApp and BaseApp, it's very inflexible and cumbersome right now.
        const rootNavigationReady = new Promise(resolve => {
            const i = setInterval(() => {
                const { ready } = getState()['features/app'] || {};

                if (ready) {
                    clearInterval(i);
                    resolve();
                }
            }, 50);
        });

        await rootNavigationReady;

        // Check if serverURL is configured externally and not allowed to change.
        const serverURLChangeEnabled = getFeatureFlag(getState(), SERVER_URL_CHANGE_ENABLED, true);

        if (!serverURLChangeEnabled) {
            // As serverURL is provided externally, so we push it to settings.
            if (typeof this.props.url !== 'undefined') {
                const { serverURL } = this.props.url;

                if (typeof serverURL !== 'undefined') {
                    dispatch(updateSettings({ serverURL }));
                }
            }
        }

        dispatch(updateSettings(this.props.userInfo || {}));

        // Update settings with feature-flag.
        const callIntegrationEnabled = this.props.flags[CALL_INTEGRATION_ENABLED];

        if (typeof callIntegrationEnabled !== 'undefined') {
            dispatch(updateSettings({ disableCallIntegration: !callIntegrationEnabled }));
        }
    }

    /**
     * Overrides the parent method to inject {@link DimensionsDetector} as
     * the top most component.
     *
     * @override
     */
    _createMainElement(component, props) {
        return (
            <SafeAreaProvider>
                <DimensionsDetector
                    onDimensionsChanged = { this._onDimensionsChanged }
                    onSafeAreaInsetsChanged = { this._onSafeAreaInsetsChanged }>
                    { super._createMainElement(component, props) }
                </DimensionsDetector>
            </SafeAreaProvider>
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
            // solution implemented below was tested on Android only so it is
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

    _onDimensionsChanged: (width: number, height: number) => void;

    /**
     * Updates the known available size for the app to occupy.
     *
     * @param {number} width - The component's current width.
     * @param {number} height - The component's current height.
     * @private
     * @returns {void}
     */
    _onDimensionsChanged(width: number, height: number) {
        const { dispatch } = this.state.store;

        dispatch(clientResized(width, height));
    }

    /**
     * Updates the safe are insets values.
     *
     * @param {Object} insets - The insets.
     * @param {number} insets.top - The top inset.
     * @param {number} insets.right - The right inset.
     * @param {number} insets.bottom - The bottom inset.
     * @param {number} insets.left - The left inset.
     * @private
     * @returns {void}
     */
    _onSafeAreaInsetsChanged(insets) {
        const { dispatch } = this.state.store;

        dispatch(setSafeAreaInsets(insets));
    }

    /**
     * Renders the platform specific dialog container.
     *
     * @returns {React$Element}
     */
    _renderDialogContainer() {
        return (
            <DialogContainerWrapper
                pointerEvents = 'box-none'
                style = { StyleSheet.absoluteFill }>
                <BottomSheetContainer />
                <DialogContainer />
            </DialogContainerWrapper>
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
