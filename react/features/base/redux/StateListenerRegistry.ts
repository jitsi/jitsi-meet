import { Store } from 'redux';

import { IReduxState, IStore } from '../../app/types';

import { equals } from './functions';
import logger from './logger';

/**
 * The type listener supported for registration with
 * {@link StateListenerRegistry} in association with a {@link Selector}.
 *
 * @param {any} selection - The value derived from the redux store/state by the
 * associated {@code Selector}. Immutable!
 * @param {Store} store - The redux store. Provided in case the {@code Listener}
 * needs to {@code dispatch} or {@code getState}. The latter is advisable only
 * if the {@code Listener} is not to respond to changes to that state.
 * @param {any} prevSelection - The value previously derived from the redux
 * store/state by the associated {@code Selector}. The {@code Listener} is
 * invoked only if {@code prevSelection} and {@code selection} are different.
 * Immutable!
 */
type Listener
    = (selection: any, store: IStore, prevSelection: any) => void;

/**
 * The type selector supported for registration with
 * {@link StateListenerRegistry} in association with a {@link Listener}.
 *
 * @param {IReduxState} state - The redux state from which the {@code Selector} is to
 * derive data.
 * @param {any} prevSelection - The value previously derived from the redux
 * store/state by the {@code Selector}. Provided in case the {@code Selector}
 * needs to derive the returned value from the specified {@code state} and
 * {@code prevSelection}. Immutable!
 * @returns {any} The value derived from the specified {@code state} and/or
 * {@code prevSelection}. The associated {@code Listener} will only be invoked
 * if the returned value is other than {@code prevSelection}.
 */
type Selector = (state: IReduxState, prevSelection: any) => any;

/**
 * Options that can be passed to the register method.
 */
type RegistrationOptions = {

    /**
     * @property {boolean} [deepEquals=false] - Whether or not a deep equals check should be performed on the selection
     * returned by {@link Selector}.
     */
    deepEquals?: boolean;
};

/**
 * A type of a {@link Selector}-{@link Listener} association in which the
 * {@code Listener} listens to changes in the values derived from a redux
 * store/state by the {@code Selector}.
 */
type SelectorListener = {

    /**
     * The {@code Listener} which listens to changes in the values selected by
     * {@link selector}.
     */
    listener: Listener;

    /**
     * The {@link RegistrationOptions} passed during the registration to be applied on the listener.
     */
    options?: RegistrationOptions;

    /**
     * The {@code Selector} which selects values whose changes are listened to
     * by {@link listener}.
     */
    selector: Selector;
};

/**
 * A registry listeners which listen to changes in a redux store/state.
 */
class StateListenerRegistry {
    /**
     * The {@link Listener}s registered with this {@code StateListenerRegistry}
     * to be notified when the values derived by associated {@link Selector}s
     * from a redux store/state change.
     */
    _selectorListeners: Set<SelectorListener> = new Set();

    /**
     * Invoked by a specific redux store any time an action is dispatched, and
     * some part of the state (tree) may potentially have changed.
     *
     * @param {Object} context - The redux store invoking the listener and the
     * private state of this {@code StateListenerRegistry} associated with the
     * redux store.
     * @returns {void}
     */
    _listener({ prevSelections, store }: {
        prevSelections: Map<SelectorListener, any>;
        store: Store<any, any>;
    }) {
        for (const selectorListener of this._selectorListeners) {
            const prevSelection = prevSelections.get(selectorListener);

            try {
                const selection
                    = selectorListener.selector(
                        store.getState(),
                        prevSelection);
                const useDeepEquals = selectorListener?.options?.deepEquals;

                if ((useDeepEquals && !equals(prevSelection, selection))
                        || (!useDeepEquals && prevSelection !== selection)) {
                    prevSelections.set(selectorListener, selection);
                    selectorListener.listener(selection, store, prevSelection);
                }
            } catch (e) {
                // Don't let one faulty listener prevent other listeners from
                // being notified about their associated changes.
                logger.error(e);
            }
        }
    }

    /**
     * Registers a specific listener to be notified when the value derived by a
     * specific {@code selector} from a redux store/state changes.
     *
     * @param {Function} selector - The pure {@code Function} of the redux
     * store/state (and the previous selection of made by {@code selector})
     * which selects the value listened to by the specified {@code listener}.
     * @param {Function} listener - The listener to register with this
     * {@code StateListenerRegistry} so that it gets invoked when the value
     * returned by the specified {@code selector} changes.
     * @param {RegistrationOptions} [options] - Any options to be applied to the registration.
     * @returns {void}
     */
    register(selector: Selector, listener: Listener, options?: RegistrationOptions) {
        if (typeof selector !== 'function' || typeof listener !== 'function') {
            throw new Error('Invalid selector or listener!');
        }

        this._selectorListeners.add({
            listener,
            selector,
            options
        });
    }

    /**
     * Subscribes to a specific redux store (so that this instance gets notified
     * any time an action is dispatched, and some part of the state (tree) of
     * the specified redux store may potentially have changed).
     *
     * @param {Store} store - The redux store to which this
     * {@code StateListenerRegistry} is to {@code subscribe}.
     * @returns {void}
     */
    subscribe(store: Store<any, any>) {
        // XXX If StateListenerRegistry is not utilized by the app to listen to
        // state changes, do not bother subscribing to the store at all.
        if (this._selectorListeners.size) {
            store.subscribe(
                this._listener.bind(
                    this,
                    {
                        /**
                         * The previous selections of the {@code Selector}s
                         * registered with this {@code StateListenerRegistry}.
                         *
                         * @type Map<any>
                         */
                        prevSelections: new Map(),

                        /**
                         * The redux store.
                         *
                         * @type Store
                         */
                        store
                    }));
        }
    }
}

export default new StateListenerRegistry();
