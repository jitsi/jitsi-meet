/* global APP, JitsiMeetJS, loggingConfig $ */
import React from 'react';
import { Provider } from 'react-redux';
import { compose } from 'redux';
import {
    browserHistory,
    Route,
    Router
} from 'react-router';
import { push, syncHistoryWithStore } from 'react-router-redux';

import { getDomain } from '../../base/connection';
import { RouteRegistry } from '../../base/navigator';

import { AbstractApp } from './AbstractApp';
import settings from '../../../../modules/settings/Settings';


import URLProcessor from '../../../../modules/config/URLProcessor';
import getTokenData from '../../../../modules/tokendata/TokenData';
import JitsiMeetLogStorage from '../../../../modules/util/JitsiMeetLogStorage';

// eslint-disable-next-line max-len
import KeyboardShortcut from '../../../../modules/keyboardshortcut/keyboardshortcut';

const Logger = require('jitsi-meet-logger');
const LogCollector = Logger.LogCollector;


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
    static propTypes = AbstractApp.propTypes;

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
        this._onRouteEnter = this._onRouteEnter.bind(this);
        this._routerCreateElement = this._routerCreateElement.bind(this);
        this._getRoute = this._getRoute.bind(this);
        this._getRoutes = this._getRoutes.bind(this);
    }

    /**
     * Init translation from old app.
     *
     * @inheritdoc
     */
    componentWillMount(...args) {
        super.componentWillMount(...args);

        URLProcessor.setConfigParametersFromUrl();

        /* APP.init BEGIN */

        /*  Init logging BEGIN */

        // Adjust logging level
        configureLoggingLevels();

        // Create the LogCollector and register it as the global log transport.
        // It is done early to capture as much logs as possible. Captured logs
        // will be cached, before the JitsiMeetLogStorage gets ready (statistics
        // module is initialized).
        if (!APP.logCollector && !loggingConfig.disableLogCollector) {
            APP.logCollector = new LogCollector(new JitsiMeetLogStorage());
            Logger.addGlobalTransport(APP.logCollector);
            JitsiMeetJS.addGlobalLogTransport(APP.logCollector);
        }

        /*  Init logging BEGIN */

        APP.keyboardshortcut = KeyboardShortcut;
        APP.tokenData = getTokenData();

        /* APP.init END */

        APP.API.init(APP.tokenData.externalAPISettings);

        /**
         * Adjusts the logging levels.
         *
         * @private
         * @returns {void}
         */
        function configureLoggingLevels() {
            // NOTE The library Logger is separated from
            // the app loggers, so the levels
            // have to be set in two places

            // Set default logging level
            const defaultLogLevel
                = loggingConfig.defaultLogLevel || JitsiMeetJS.logLevels.TRACE;

            Logger.setLogLevel(defaultLogLevel);
            JitsiMeetJS.setLogLevel(defaultLogLevel);

            // NOTE console was used on purpose here to go around the logging
            // and always print the default logging level to the console
            console.info(`Default logging level set to: ${defaultLogLevel}`);

            // Set log level for each logger
            if (loggingConfig) {
                Object.keys(loggingConfig).forEach(loggerName => {
                    if (loggerName !== 'defaultLogLevel') {
                        const level = loggingConfig[loggerName];

                        Logger.setLogLevelById(level, loggerName);
                        JitsiMeetJS.setLogLevelById(level, loggerName);
                    }
                });
            }
        }


        APP.translation.init(settings.getLanguage());
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
                    { this._getRoutes() }
                </Router>
            </Provider>
        );
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

        return store.dispatch(push(path));
    }

    /**
     * Returns routes for application.
     *
     * @returns {Array}
     * @private
     */
    _getRoutes() {
        const routes = RouteRegistry.getRoutes();

        return routes.map(this._getRoute);
    }

    /**
     * Method returns route for React Router.
     *
     * @param {Object} route - Object that describes route.
     * @returns {ReactElement}
     * @private
     */
    _getRoute(route) {
        const onEnter = route.onEnter || $.noop;
        const handler = compose(this._onRouteEnter, onEnter);

        return (
            <Route
                component = { route.component }
                key = { route.component }
                onEnter = { handler }
                path = { route.path } />
        );
    }

    /**
     * Invoked by react-router to notify this App that a Route is about to be
     * rendered.
     *
     * @private
     * @returns {void}
     */
    _onRouteEnter() {

        // XXX The following is mandatory. Otherwise, moving back & forward
        // through the browser's history could leave this App on the Conference
        // page without a room name.

        // Our Router configuration (at the time of this writing) is such that
        // each Route corresponds to a single URL. Hence, entering into a Route
        // is like opening a URL.

        // XXX In order to unify work with URLs in web and native environments,
        // we will construct URL here with correct domain from config.
        const currentDomain = getDomain(this.props.store.getState);
        const url
            = new URL(window.location.pathname, `https://${currentDomain}`)
                .toString();

        this._openURL(url);
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
