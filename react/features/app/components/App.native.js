/* global __DEV__ */

import React from 'react';
import { Linking, Navigator, Platform } from 'react-native';
import { Provider } from 'react-redux';

import { _getRouteToRender } from '../functions';
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
    static propTypes = AbstractApp.propTypes

    /**
     * Initializes a new App instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._navigatorRenderScene = this._navigatorRenderScene.bind(this);
        this._onLinkingURL = this._onLinkingURL.bind(this);

        // In the Release configuration, React Native will (intentionally) throw
        // an unhandled JavascriptException for an unhandled JavaScript error.
        // This will effectively kill the application. In accord with the Web,
        // do not kill the application.
        this._maybeDisableExceptionsManager();
    }

    /**
     * Subscribe to notifications about activating URLs registered to be handled
     * by this app.
     *
     * @inheritdoc
     * @see https://facebook.github.io/react-native/docs/linking.html
     * @returns {void}
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
     * @see https://facebook.github.io/react-native/docs/linking.html
     * @returns {void}
     */
    componentWillUnmount() {
        Linking.removeEventListener('url', this._onLinkingURL);

        super.componentWillUnmount();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const store = this.props.store;

        /* eslint-disable brace-style, react/jsx-no-bind */

        return (
            <Provider store = { store }>
                <Navigator
                    initialRoute = { _getRouteToRender(store.getState) }
                    ref = { navigator => { this.navigator = navigator; } }
                    renderScene = { this._navigatorRenderScene } />
            </Provider>
        );

        /* eslint-enable brace-style, react/jsx-no-bind */
    }

    /**
     * Navigates to a specific Route (via platform-specific means).
     *
     * @param {Route} route - The Route to which to navigate.
     * @returns {void}
     */
    _navigate(route) {
        const navigator = this.navigator;

        // TODO Currently, the replace method doesn't support animation. Work
        // towards adding it is done in
        // https://github.com/facebook/react-native/issues/1981
        // XXX React Native's Navigator adds properties to the route it's
        // provided with. Clone the specified route in order to prevent its
        // modification.
        navigator && navigator.replace({ ...route });
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

    /**
     * Renders the scene identified by a specific route in the Navigator of this
     * instance.
     *
     * @param {Object} route - The route which identifies the scene to be
     * rendered in the associated Navigator. In the fashion of NavigatorIOS, the
     * specified route is expected to define a value for its component property
     * which is the type of React component to be rendered.
     * @private
     * @returns {ReactElement}
     */
    _navigatorRenderScene(route) {
        // We started with NavigatorIOS and then switched to Navigator in order
        // to support Android as well. In order to reduce the number of
        // modifications, accept the same format of route definition.
        return this._createElement(route.component, {});
    }

    /**
     * Notified by React's Linking API that a specific URL registered to be
     * handled by this App was activated.
     *
     * @param {Object} event - The details of the notification/event.
     * @param {string} event.url - The URL registered to be handled by this App
     * which was activated.
     * @private
     * @returns {void}
     */
    _onLinkingURL(event) {
        this._openURL(event.url);
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
