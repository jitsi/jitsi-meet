// @ts-expect-error
import { jitsiLocalStorage } from '@jitsi/js-utils';
import { isEqual } from 'lodash-es';
import React, { Component, ComponentType, Fragment } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { compose, createStore } from 'redux';
import Thunk from 'redux-thunk';

import { IStore } from '../../../app/types';
import i18next from '../../i18n/i18next';
import MiddlewareRegistry from '../../redux/MiddlewareRegistry';
import PersistenceRegistry from '../../redux/PersistenceRegistry';
import ReducerRegistry from '../../redux/ReducerRegistry';
import StateListenerRegistry from '../../redux/StateListenerRegistry';
import SoundCollection from '../../sounds/components/SoundCollection';
import { appWillMount, appWillUnmount } from '../actions';
import logger from '../logger';

/**
 * The type of the React {@code Component} state of {@link BaseApp}.
 */
interface IState {

    /**
     * The {@code Route} rendered by the {@code BaseApp}.
     */
    route: {
        component?: ComponentType;
        props?: Object;
    };

    /**
     * The redux store used by the {@code BaseApp}.
     */
    store?: IStore;
}

/**
 * Base (abstract) class for main App component.
 *
 * @abstract
 */
export default class BaseApp<P> extends Component<P, IState> {
    /**
     * The deferred for the initialisation {{promise, resolve, reject}}.
     */
    _init: PromiseWithResolvers<any>;

    /**
     * Initializes a new {@code BaseApp} instance.
     *
     * @param {Object} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: P) {
        super(props);

        this.state = {
            route: {},
            store: undefined
        };
    }

    /**
     * Initializes the app.
     *
     * @inheritdoc
    */
    override async componentDidMount() {
        /**
         * Make the mobile {@code BaseApp} wait until the {@code AsyncStorage}
         * implementation of {@code Storage} initializes fully.
         *
         * @private
         * @see {@link #_initStorage}
         * @type {Promise}
         */
        this._init = Promise.withResolvers();

        try {
            await this._initStorage();

            const setStatePromise = new Promise(resolve => {
                this.setState({
                    // @ts-ignore
                    store: this._createStore()
                }, resolve);
            });

            await setStatePromise;

            await this._extraInit();
        } catch (err) {
            /* BaseApp should always initialize! */
            logger.error(err);
        }

        this.state.store?.dispatch(appWillMount(this));

        // @ts-ignore
        this._init.resolve();
    }

    /**
     * De-initializes the app.
     *
     * @inheritdoc
     */
    override componentWillUnmount() {
        this.state.store?.dispatch(appWillUnmount(this));
    }

    /**
     * Logs for errors that were not caught.
     *
     * @param {Error} error - The error that was thrown.
     * @param {Object} info - Info about the error(stack trace);.
     *
     * @returns {void}
     */
    override componentDidCatch(error: Error, info: Object) {
        logger.error(error, info);
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
    _initStorage(): Promise<any> {
        const _initializing = jitsiLocalStorage.getItem('_initializing');

        return _initializing || Promise.resolve();
    }

    /**
     * Extra initialisation that subclasses might require.
     *
     * @returns {void}
     */
    _extraInit() {
        // To be implemented by subclass.
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        const { route: { component, props }, store } = this.state;

        if (store) {
            return (
                <I18nextProvider i18n = { i18next }>
                    {/* @ts-ignore */}
                    <Provider store = { store }>
                        <Fragment>
                            { this._createMainElement(component, props) }
                            <SoundCollection />
                            { this._createExtraElement() }
                            { this._renderDialogContainer() }
                        </Fragment>
                    </Provider>
                </I18nextProvider>
            );
        }

        return null;
    }

    /**
     * Creates an extra {@link ReactElement}s to be added (unconditionally)
     * alongside the main element.
     *
     * @returns {ReactElement}
     * @abstract
     * @protected
     */
    _createExtraElement(): React.ReactElement | null {
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
    _createMainElement(component?: ComponentType, props?: Object) {
        return component ? React.createElement(component, props || {}) : null;
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
        const middleware = MiddlewareRegistry.applyMiddleware(Thunk);

        // @ts-ignore
        const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
        const store = createStore(reducer, PersistenceRegistry.getPersistedState(), composeEnhancers(middleware));

        // StateListenerRegistry
        StateListenerRegistry.subscribe(store);

        // This is temporary workaround to be able to dispatch actions from
        // non-reactified parts of the code (conference.js for example).
        // Don't use in the react code!!!
        // FIXME: remove when the reactification is finished!
        if (typeof APP !== 'undefined') {
            // @ts-ignore
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
    _navigate(route: {
        component?: ComponentType<any>;
        href?: string;
        props?: Object;
    }): Promise<any> {
        if (isEqual(route, this.state.route)) {
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
        return new Promise(resolve => { // @ts-ignore
            this.setState({ route }, resolve);
        });
    }

    /**
     * Renders the platform specific dialog container.
     *
     * @returns {React$Element}
     */
    _renderDialogContainer(): React.ReactElement | null {
        return null;
    }
}
