// @flow

import _ from 'lodash';
import React, { Component, Fragment } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { compose, createStore } from 'redux';
import Thunk from 'redux-thunk';

import { i18next } from '../../i18n';
import {
    MiddlewareRegistry,
    ReducerRegistry,
    StateListenerRegistry
} from '../../redux';
import { SoundCollection } from '../../sounds';
import { PersistenceRegistry } from '../../storage';

import { appWillMount, appWillUnmount } from '../actions';

declare var APP: Object;

type State = {

    /**
     * The state of the »possible« async initialization of
     * the {@code BaseApp}.
     */
    initialized: boolean,

    /**
     * The Route rendered by this {@code BaseApp}.
     */
    route: Object,

    /**
     * The redux store used by this {@code BaseApp}.
     */
    store: Object
};

/**
 * Base (abstract) class for main App component.
 *
 * @abstract
 */
export default class BaseApp extends Component<*, State> {
    _init: Promise<*>;

    /**
     * Initializes a new {@code BaseApp} instance.
     *
     * @param {Object} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Object) {
        super(props);

        this.state = {
            initialized: false,
            route: {},

            // $FlowFixMe
            store: undefined
        };

        /**
         * Make the mobile {@code BaseApp} wait until the
         * {@code AsyncStorage} implementation of {@code Storage} initializes
         * fully.
         *
         * @private
         * @see {@link #_initStorage}
         * @type {Promise}
         */
        this._init
            = this._initStorage()
                .catch(() => { /* AbstractApp should always initialize! */ })
                .then(() =>
                    this.setState({
                        store: this._createStore()
                    }));
    }

    /**
     * Initialize the application.
     *
     * @inheritdoc
     */
    componentWillMount() {
        this._init.then(() => {
            const { dispatch } = this.state.store;

            dispatch(appWillMount(this));

            // We set the initialized state here and not in the constructor to
            // make sure that {@code componentWillMount} gets invoked before
            // the app tries to render the actual app content.
            this.setState({ initialized: true });
        });
    }

    /**
     * De-initialize the application.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        const { dispatch } = this.state.store;

        dispatch(appWillUnmount(this));
    }

    /**
     * Delays this {@code BaseApp}'s startup until the {@code Storage}
     * implementation of {@code localStorage} initializes. While the
     * initialization is instantaneous on Web (with Web Storage API), it is
     * asynchronous on mobile/react-native.
     *
     * @private
     * @returns {Promise}
     */
    _initStorage(): Promise<*> {
        const { _initializing } = window.localStorage;

        return _initializing || Promise.resolve();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { initialized, route, store } = this.state;
        const { component } = route;

        if (initialized && component) {
            return (
                <I18nextProvider i18n = { i18next }>
                    <Provider store = { store }>
                        <Fragment>
                            { this._createMainElement(component) }
                            <SoundCollection />
                            { this._createExtraElement() }
                        </Fragment>
                    </Provider>
                </I18nextProvider>
            );
        }

        return null;
    }

    /**
     * Creates an extra {@link ReactElement}s to be added (unconditionaly)
     * alongside the main element.
     *
     * @returns {ReactElement}
     * @abstract
     * @protected
     */
    _createExtraElement() {
        return null;
    }

    /**
     * Creates a {@link ReactElement} from the specified component, the
     * specified props and the props of this {@code AbstractApp} which are
     * suitable for propagation to the children of this {@code Component}.
     *
     * @param {Component} component - The component from which the
     * {@code ReactElement} is to be created.
     * @param {Object} props - The read-only React {@code Component} props with
     * which the {@code ReactElement} is to be initialized.
     * @returns {ReactElement}
     * @protected
     */
    _createMainElement(component, props) {
        return React.createElement(component, props || {});
    }

    /**
     * Initializes a new redux store instance suitable for use by this
     * {@code AbstractApp}.
     *
     * @private
     * @returns {Store} - A new redux store instance suitable for use by
     * this {@code AbstractApp}.
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

        const store = createStore(
            reducer, PersistenceRegistry.getPersistedState(), middleware);

        // StateListenerRegistry
        StateListenerRegistry.subscribe(store);

        // This is temporary workaround to be able to dispatch actions from
        // non-reactified parts of the code (conference.js for example).
        // Don't use in the react code!!!
        // FIXME: remove when the reactification is finished!
        if (typeof APP !== 'undefined') {
            APP.store = store;
        }

        return store;
    }

    /**
     * Navigates to a specific Route.
     *
     * @param {Route} route - The Route to which to navigate.
     * @returns {Promise}
     */
    _navigate(route): Promise<*> {
        if (_.isEqual(route, this.state.route)) {
            return Promise.resolve();
        }

        if (route.href) {
            // This navigation requires loading a new URL in the browser.
            window.location.href = route.href;

            return Promise.resolve();
        }

        // XXX React's setState is asynchronous which means that the value of
        // this.state.route above may not even be correct. If the check is
        // performed before setState completes, the app may not navigate to the
        // expected route. In order to mitigate the problem, _navigate was
        // changed to return a Promise.
        return new Promise(resolve => {
            this.setState({ route }, resolve);
        });
    }
}
