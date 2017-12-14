/* @flow */

import _ from 'lodash';
import Logger from 'jitsi-meet-logger';

import persisterConfig from './persisterconfig.json';

const logger = Logger.getLogger(__filename);
const PERSISTED_STATE_NAME = 'jitsi-state';

/**
 * Sets specific properties of a specific state to specific values and prevents
 * unnecessary state changes.
 *
 * @param {Object} target - The state on which the specified properties are to
 * be set.
 * @param {Object} source - The map of properties to values which are to be set
 * on the specified target.
 * @returns {Object} The specified target if the values of the specified
 * properties equal the specified values; otherwise, a new state constructed
 * from the specified target by setting the specified properties to the
 * specified values.
 */
export function assign(target: Object, source: Object) {
    let t = target;

    for (const property in source) { // eslint-disable-line guard-for-in
        t = _set(t, property, source[property], t === target);
    }

    return t;
}

/**
 * Determines whether {@code a} equals {@code b} according to deep comparison
 * (which makes sense for Redux and its state definition).
 *
 * @param {*} a - The value to compare to {@code b}.
 * @param {*} b - The value to compare to {@code a}.
 * @returns {boolean} True if {@code a} equals {@code b} (according to deep
 * comparison); false, otherwise.
 */
export function equals(a: any, b: any) {
    return _.isEqual(a, b);
}

/**
 * Prepares a filtered state-slice (Redux term) based on the config for
 * persisting or for retreival.
 *
 * @private
 * @param {Object} persistedSlice - The redux state-slice.
 * @param {Object} persistedSliceConfig - The related config sub-tree.
 * @returns {Object}
 */
function _getFilteredSlice(persistedSlice, persistedSliceConfig) {
    const filteredpersistedSlice = {};

    for (const persistedKey of Object.keys(persistedSlice)) {
        if (persistedSliceConfig[persistedKey]) {
            filteredpersistedSlice[persistedKey] = persistedSlice[persistedKey];
        }
    }

    return filteredpersistedSlice;
}

/**
 * Prepares a filtered state from the actual or the
 * persisted Redux state, based on the config.
 *
 * @private
 * @param {Object} state - The actual or persisted redux state.
 * @returns {Object}
 */
function _getFilteredState(state: Object) {
    const filteredState = {};

    for (const slice of Object.keys(persisterConfig)) {
        filteredState[slice] = _getFilteredSlice(
            state[slice],
            persisterConfig[slice]
        );
    }

    return filteredState;
}

/**
 *  Returns the persisted redux state. This function takes
 * the persisterConfig into account as we may have persisted something
 * in the past that we don't want to retreive anymore. The next
 * {@link #persistState} will remove those values.
 *
 * @returns {Object}
 */
export function getPersistedState() {
    let persistedState = window.localStorage.getItem(PERSISTED_STATE_NAME);

    if (persistedState) {
        try {
            persistedState = JSON.parse(persistedState);
        } catch (error) {
            return {};
        }

        const filteredPersistedState = _getFilteredState(persistedState);

        logger.info('Redux state rehydrated', filteredPersistedState);

        return filteredPersistedState;
    }

    return {};
}

/**
 * Persists a filtered subtree of the redux state into {@code localStorage}.
 *
 * @param {Object} state - The redux state.
 * @returns {void}
 */
export function persistState(state: Object) {
    const filteredState = _getFilteredState(state);

    window.localStorage.setItem(
        PERSISTED_STATE_NAME,
        JSON.stringify(filteredState)
    );

    logger.info('Redux state persisted');
}

/**
 * Sets a specific property of a specific state to a specific value. Prevents
 * unnecessary state changes (when the specified {@code value} is equal to the
 * value of the specified {@code property} of the specified {@code state}).
 *
 * @param {Object} state - The (Redux) state from which a new state is to be
 * constructed by setting the specified {@code property} to the specified
 * {@code value}.
 * @param {string} property - The property of {@code state} which is to be
 * assigned the specified {@code value} (in the new state).
 * @param {*} value - The value to assign to the specified {@code property}.
 * @returns {Object} The specified {@code state} if the value of the specified
 * {@code property} equals the specified <tt>value/tt>; otherwise, a new state
 * constructed from the specified {@code state} by setting the specified
 * {@code property} to the specified {@code value}.
 */
export function set(state: Object, property: string, value: any) {
    return _set(state, property, value, /* copyOnWrite */ true);
}

/* eslint-disable max-params */

/**
 * Sets a specific property of a specific state to a specific value. Prevents
 * unnecessary state changes (when the specified {@code value} is equal to the
 * value of the specified {@code property} of the specified {@code state}).
 *
 * @param {Object} state - The (Redux) state from which a state is to be
 * constructed by setting the specified {@code property} to the specified
 * {@code value}.
 * @param {string} property - The property of {@code state} which is to be
 * assigned the specified {@code value}.
 * @param {*} value - The value to assign to the specified {@code property}.
 * @param {boolean} copyOnWrite - If the specified {@code state} is to not be
 * modified, {@code true}; otherwise, {@code false}.
 * @returns {Object} The specified {@code state} if the value of the specified
 * {@code property} equals the specified <tt>value/tt> or {@code copyOnWrite}
 * is truthy; otherwise, a new state constructed from the specified
 * {@code state} by setting the specified {@code property} to the specified
 * {@code value}.
 */
function _set(
        state: Object,
        property: string,
        value: any,
        copyOnWrite: boolean) {
    // Delete state properties that are to be set to undefined. (It is a matter
    // of personal preference, mostly.)
    if (typeof value === 'undefined'
            && Object.prototype.hasOwnProperty.call(state, property)) {
        const newState = copyOnWrite ? { ...state } : state;

        if (delete newState[property]) {
            return newState;
        }
    }

    if (state[property] !== value) {
        if (copyOnWrite) {
            return {
                ...state,
                [property]: value
            };
        }

        state[property] = value;
    }

    return state;
}

/* eslint-enable max-params */

/**
 * Returns redux state from the specified {@code stateful} which is presumed to
 * be related to the redux state (e.g. the redux store, the redux
 * {@code getState} function).
 *
 * @param {Function|Object} stateful - The entity such as the redux store or the
 * redux {@code getState} function from which the redux state is to be
 * returned.
 * @returns {Object} The redux state.
 */
export function toState(stateful: Function | Object) {
    if (stateful) {
        if (typeof stateful === 'function') {
            return stateful();
        }

        const { getState } = stateful;

        if (typeof getState === 'function') {
            return getState();
        }
    }

    return stateful;
}
