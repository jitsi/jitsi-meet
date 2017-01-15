import React from 'react';
import { Provider } from 'react-redux';
import { browserHistory, Route, Router } from 'react-router';
import { push, replace, syncHistoryWithStore } from 'react-router-redux';

import { RouteRegistry } from '../../base/navigator';

import { appInit } from '../actions';
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

        /**
         * Create an enhanced history that syncs navigation events with the
         * store.
         * @link https://github.com/reactjs/react-router-redux#how-it-works
         */
        this.history = syncHistoryWithStore(browserHistory, props.store);

        // Bind event handlers so they are only bound once for every instance.
        this._routerCreateElement = this._routerCreateElement.bind(this);
    }

    /**
     * Inits the app before component will mount.
     *
     * @inheritdoc
     */
    componentWillMount(...args) {
        super.componentWillMount(...args);

        this.props.store.dispatch(appInit());
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Provider store = { this.props.store }>
                <Router
                    createElement = { this._routerCreateElement }
                    history = { this.history }>
                    {
                        this._renderRoutes()
                    }
                </Router>
            </Provider>
        );
    }

    /**
     * Gets a Location object from the window with information about the current
     * location of the document.
     *
     * @inheritdoc
     */
    _getWindowLocation() {
        return window.location;
    }

    /**
     * Navigates to a specific Route (via platform-specific means).
     *
     * @param {Route} route - The Route to which to navigate.
     * @returns {void}
     */
    _navigate(route) {
        let path = route.path;
        const store = this.props.store;

        // The syntax :room bellow is defined by react-router. It "matches a URL
        // segment up to the next /, ?, or #. The matched string is called a
        // param."
        path
            = path.replace(
                /:room/g,
                store.getState()['features/base/conference'].room);

        return (
            store.dispatch(
                    (window.location.pathname === path ? replace : push)(
                            path)));
    }

    /**
     * Invoked by react-router to notify this App that a Route is about to be
     * rendered.
     *
     * @param {Route} route - The Route that is about to be rendered.
     * @private
     * @returns {void}
     */
    _onRouteEnter(route, ...args) {
        // Notify the route that it is about to be entered.
        const onEnter = route.onEnter;

        if (typeof onEnter === 'function') {
            onEnter(...args);
        }

        // XXX The following is mandatory. Otherwise, moving back & forward
        // through the browser's history could leave this App on the Conference
        // page without a room name.

        // Our Router configuration (at the time of this writing) is such that
        // each Route corresponds to a single URL. Hence, entering into a Route
        // is like opening a URL.
        this._openURL(window.location.toString());
    }

    /**
     * Renders a specific Route (for the purposes of the Router of this App).
     *
     * @param {Object} route - The Route to render.
     * @returns {ReactElement}
     * @private
     */
    _renderRoute(route) {
        const onEnter = (...args) => {
            this._onRouteEnter(route, ...args);
        };

        return (
            <Route
                component = { route.component }
                key = { route.component }
                onEnter = { onEnter }
                path = { route.path } />
        );
    }

    /**
     * Renders the Routes of the Router of this App.
     *
     * @returns {Array.<ReactElement>}
     * @private
     */
    _renderRoutes() {
        return RouteRegistry.getRoutes().map(this._renderRoute, this);
    }

    /**
     * Create a ReactElement from the specified component and props on behalf of
     * the associated Router.
     *
     * @param {Component} component - The component from which the ReactElement
     * is to be created.
     * @param {Object} props - The read-only React Component props with which
     * the ReactElement is to be initialized.
     * @private
     * @returns {ReactElement}
     */
    _routerCreateElement(component, props) {
        return this._createElement(component, props);
    }
}
