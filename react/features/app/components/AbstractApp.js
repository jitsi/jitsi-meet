import React, { Component } from 'react';
import { Provider } from 'react-redux';

import {
    localParticipantJoined,
    localParticipantLeft
} from '../../base/participants';

import {
    appNavigate,
    appWillMount,
    appWillUnmount
} from '../actions';

/**
 * Base (abstract) class for main App component.
 *
 * @abstract
 */
export class AbstractApp extends Component {
    /**
     * AbstractApp component's property types.
     *
     * @static
     */
    static propTypes = {
        config: React.PropTypes.object,
        store: React.PropTypes.object,

        /**
         * The URL, if any, with which the app was launched.
         */
        url: React.PropTypes.string
    }

    /**
     * Initializes a new App instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            /**
             * The Route rendered by this App.
             *
             * @type {Route}
             */
            route: undefined
        };
    }

    /**
     * Init lib-jitsi-meet and create local participant when component is going
     * to be mounted.
     *
     * @inheritdoc
     */
    componentWillMount() {
        const dispatch = this.props.store.dispatch;

        dispatch(appWillMount(this));

        dispatch(localParticipantJoined());

        this._openURL(this._getDefaultURL());
    }

    /**
     * Dispose lib-jitsi-meet and remove local participant when component is
     * going to be unmounted.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        const dispatch = this.props.store.dispatch;

        dispatch(localParticipantLeft());

        dispatch(appWillUnmount(this));
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const route = this.state.route;

        if (route) {
            return (
                <Provider store = { this.props.store }>
                    {
                        this._createElement(route.component)
                    }
                </Provider>
            );
        }

        return null;
    }

    /**
     * Create a ReactElement from the specified component, the specified props
     * and the props of this AbstractApp which are suitable for propagation to
     * the children of this Component.
     *
     * @param {Component} component - The component from which the ReactElement
     * is to be created.
     * @param {Object} props - The read-only React Component props with which
     * the ReactElement is to be initialized.
     * @returns {ReactElement}
     * @protected
     */
    _createElement(component, props) {
        /* eslint-disable no-unused-vars, lines-around-comment */
        const {
            // Don't propagate the config prop(erty) because the config is
            // stored inside the Redux state and, thus, is visible to the
            // children anyway.
            config,
            // Don't propagate the dispatch and store props because they usually
            // come from react-redux and programmers don't really expect them to
            // be inherited but rather explicitly connected.
            dispatch, // eslint-disable-line react/prop-types
            store,
            // The url property was introduced to be consumed entirely by
            // AbstractApp.
            url,
            // The remaining props, if any, are considered suitable for
            // propagation to the children of this Component.
            ...thisProps
        } = this.props;
        /* eslint-enable no-unused-vars, lines-around-comment */

        // eslint-disable-next-line object-property-newline
        return React.createElement(component, { ...thisProps, ...props });
    }

    /**
     * Gets the default URL to be opened when this App mounts.
     *
     * @private
     * @returns {string} The default URL to be opened when this App mounts.
     */
    _getDefaultURL() {
        // If the URL was explicitly specified to the React Component, then open
        // it.
        let url = this.props.url;

        if (url) {
            return url;
        }

        // If the execution environment provides a Location abstraction, then
        // this App at already at that location but it must be made aware of the
        // fact.
        const windowLocation = this._getWindowLocation();

        if (windowLocation) {
            url = windowLocation.toString();
            if (url) {
                return url;
            }
        }

        // By default, open the domain configured in the configuration file
        // which may be the domain at which the whole server infrastructure is
        // deployed.
        const config = this.props.config;

        if (typeof config === 'object') {
            const hosts = config.hosts;

            if (typeof hosts === 'object') {
                const domain = hosts.domain;

                if (domain) {
                    return `https://${domain}`;
                }
            }
        }

        return 'https://meet.jit.si';
    }

    /**
     * Gets a Location object from the window with information about the current
     * location of the document. Explicitly defined to allow extenders to
     * override because React Native does not usually have a location property
     * on its window unless debugging remotely in which case the browser that is
     * the remote debugger will provide a location property on the window.
     *
     * @protected
     * @returns {Location} A Location object with information about the current
     * location of the document.
     */
    _getWindowLocation() {
        return undefined;
    }

    /**
     * Navigates to a specific Route.
     *
     * @param {Route} route - The Route to which to navigate.
     * @returns {void}
     */
    _navigate(route) {
        let nextState = {
            ...this.state,
            route
        };

        // The Web App was using react-router so it utilized react-router's
        // onEnter. During the removal of react-router, modifications were
        // minimized by preserving the onEnter interface:
        // (1) Router would provide its nextState to the Route's onEnter. As the
        // role of Router is now this AbstractApp, provide its nextState.
        // (2) A replace function would be provided to the Route in case it
        // chose to redirect to another path.
        this._onRouteEnter(route, nextState, pathname => {
            // FIXME In order to minimize the modifications related to the
            // removal of react-router, the Web implementation is provided
            // bellow because the replace function is used on Web only at the
            // time of this writing. Provide a platform-agnostic implementation.
            // It should likely find the best Route matching the specified
            // pathname and navigate to it.
            window.location.pathname = pathname;

            // Do not proceed with the route because it chose to redirect to
            // another path.
            nextState = undefined;
        });

        nextState && this.setState(nextState);
    }

    /**
     * Notifies this App that a specific Route is about to be rendered.
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
    }

    /**
     * Navigates this AbstractApp to (i.e. opens) a specific URL.
     *
     * @param {string} url - The URL to which to navigate this AbstractApp (i.e.
     * the URL to open).
     * @protected
     * @returns {void}
     */
    _openURL(url) {
        this.props.store.dispatch(appNavigate(url));
    }
}
