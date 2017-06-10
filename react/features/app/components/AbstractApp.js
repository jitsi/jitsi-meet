import React, { Component } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { compose, createStore } from 'redux';
import Thunk from 'redux-thunk';

import { i18next } from '../../base/i18n';
import {
    localParticipantJoined,
    localParticipantLeft
} from '../../base/participants';
import { RouteRegistry } from '../../base/react';
import { MiddlewareRegistry, ReducerRegistry } from '../../base/redux';

import {
    appNavigate,
    appWillMount,
    appWillUnmount
} from '../actions';

declare var APP: Object;

/**
 * The default URL to open if no other was specified to {@code AbstractApp}
 * via props.
 */
const DEFAULT_URL = 'https://meet.jit.si';

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
        /**
         * The default URL {@code AbstractApp} is to open when not in any
         * conference/room.
         */
        defaultURL: React.PropTypes.string,

        /**
         * (Optional) Redux store for this app.
         */
        store: React.PropTypes.object,

        /**
         * The URL, if any, with which the app was launched.
         */
        url: React.PropTypes.string
    };

    /**
     * Initializes a new AbstractApp instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            /**
             * The Route rendered by this AbstractApp.
             *
             * @type {Route}
             */
            route: undefined,

            /**
             * The Redux store used by this AbstractApp.
             *
             * @type {Store}
             */
            store: this._maybeCreateStore(props)
        };
    }

    /**
     * Init lib-jitsi-meet and create local participant when component is going
     * to be mounted.
     *
     * @inheritdoc
     */
    componentWillMount() {
        const dispatch = this._getStore().dispatch;

        dispatch(appWillMount(this));

        // FIXME I believe it makes more sense for a middleware to dispatch
        // localParticipantJoined on APP_WILL_MOUNT because the order of actions
        // is important, not the call site. Moreover, we've got localParticipant
        // business logic in the React Component (i.e. UI) AbstractApp now.
        let localParticipant;

        if (typeof APP === 'object') {
            localParticipant = {
                avatarID: APP.settings.getAvatarId(),
                avatarURL: APP.settings.getAvatarUrl(),
                email: APP.settings.getEmail(),
                name: APP.settings.getDisplayName()
            };
        }
        dispatch(localParticipantJoined(localParticipant));

        // If a URL was explicitly specified to this React Component, then open
        // it; otherwise, use a default.
        this._openURL(this.props.url || this._getDefaultURL());
    }

    /**
     * Notifies this mounted React Component that it will receive new props.
     * Makes sure that this AbstractApp has a Redux store to use.
     *
     * @inheritdoc
     * @param {Object} nextProps - The read-only React Component props that this
     * instance will receive.
     * @returns {void}
     */
    componentWillReceiveProps(nextProps) {
        // The consumer of this AbstractApp did not provide a Redux store.
        if (typeof nextProps.store === 'undefined'

                // The consumer of this AbstractApp  did provide a Redux store
                // before. Which means that the consumer changed their mind. In
                // such a case this instance should create its own internal
                // Redux store. If the consumer did not provide a Redux store
                // before, then this instance is using its own internal Redux
                // store already.
                && typeof this.props.store !== 'undefined') {
            this.setState({
                store: this._maybeCreateStore(nextProps)
            });
        }
    }

    /**
     * Dispose lib-jitsi-meet and remove local participant when component is
     * going to be unmounted.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        const dispatch = this._getStore().dispatch;

        dispatch(localParticipantLeft());

        dispatch(appWillUnmount(this));
    }

    /**
     * Gets a Location object from the window with information about the current
     * location of the document. Explicitly defined to allow extenders to
     * override because React Native does not usually have a location property
     * on its window unless debugging remotely in which case the browser that is
     * the remote debugger will provide a location property on the window.
     *
     * @public
     * @returns {Location} A Location object with information about the current
     * location of the document.
     */
    getWindowLocation() {
        return undefined;
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
                <I18nextProvider i18n = { i18next }>
                    <Provider store = { this._getStore() }>
                        {
                            this._createElement(route.component)
                        }
                    </Provider>
                </I18nextProvider>
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
        /* eslint-disable no-unused-vars */

        const {
            // Don't propagate the dispatch and store props because they usually
            // come from react-redux and programmers don't really expect them to
            // be inherited but rather explicitly connected.
            dispatch, // eslint-disable-line react/prop-types
            store,

            // The following props were introduced to be consumed entirely by
            // AbstractApp:
            defaultURL,
            url,

            // The remaining props, if any, are considered suitable for
            // propagation to the children of this Component.
            ...thisProps
        } = this.props;

        /* eslint-enable no-unused-vars */

        return React.createElement(component, {
            ...thisProps,
            ...props
        });
    }

    /**
     * Initializes a new Redux store instance suitable for use by
     * this AbstractApp.
     *
     * @private
     * @returns {Store} - A new Redux store instance suitable for use by
     * this AbstractApp.
     */
    _createStore() {
        // Create combined reducer from all reducers in ReducerRegistry.
        const reducer = ReducerRegistry.combineReducers();

        // Apply all registered middleware from the MiddlewareRegistry and
        // additional 3rd party middleware:
        // - Thunk - allows us to dispatch async actions easily. For more info
        // @see https://github.com/gaearon/redux-thunk.
        let middleware = MiddlewareRegistry.applyMiddleware(Thunk);

        // Try to enable Redux DevTools Chrome extension in order to make it
        // available for the purposes of facilitating development.
        let devToolsExtension;

        if (typeof window === 'object'
                && (devToolsExtension = window.devToolsExtension)) {
            middleware = compose(middleware, devToolsExtension());
        }

        return createStore(reducer, middleware);
    }

    /**
     * Gets the default URL to be opened when this App mounts.
     *
     * @protected
     * @returns {string} The default URL to be opened when this App mounts.
     */
    _getDefaultURL() {
        // If the execution environment provides a Location abstraction, then
        // this App at already at that location but it must be made aware of the
        // fact.
        const windowLocation = this.getWindowLocation();

        if (windowLocation) {
            const href = windowLocation.toString();

            if (href) {
                return href;
            }
        }

        return this.props.defaultURL || DEFAULT_URL;
    }

    /**
     * Gets the Redux store used by this AbstractApp.
     *
     * @protected
     * @returns {Store} - The Redux store used by this AbstractApp.
     */
    _getStore() {
        let store = this.state.store;

        if (typeof store === 'undefined') {
            store = this.props.store;
        }

        return store;
    }

    /**
     * Creates a Redux store to be used by this AbstractApp if such as store is
     * not defined by the consumer of this AbstractApp through its
     * read-only React Component props.
     *
     * @param {Object} props - The read-only React Component props that will
     * eventually be received by this AbstractApp.
     * @private
     * @returns {Store} - The Redux store to be used by this AbstractApp.
     */
    _maybeCreateStore(props) {
        // The application Jitsi Meet is architected with Redux. However, I do
        // not want consumers of the App React Component to be forced into
        // dealing with Redux. If the consumer did not provide an external Redux
        // store, utilize an internal Redux store.
        let store = props.store;

        if (typeof store === 'undefined') {
            store = this._createStore();

            // This is temporary workaround to be able to dispatch actions from
            // non-reactified parts of the code (conference.js for example).
            // Don't use in the react code!!!
            // FIXME: remove when the reactification is finished!
            if (typeof APP !== 'undefined') {
                APP.store = store;
            }
        }

        return store;
    }

    /**
     * Navigates to a specific Route.
     *
     * @param {Route} route - The Route to which to navigate.
     * @returns {void}
     */
    _navigate(route) {
        if (RouteRegistry.areRoutesEqual(this.state.route, route)) {
            return;
        }

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
        route && this._onRouteEnter(route, nextState, pathname => {
            this._openURL(pathname);

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
        const { onEnter } = route;

        typeof onEnter === 'function' && onEnter(...args);
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
        this._getStore().dispatch(appNavigate(url));
    }
}
