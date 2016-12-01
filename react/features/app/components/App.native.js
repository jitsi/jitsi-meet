import React from 'react';
import { Linking, Navigator } from 'react-native';
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
