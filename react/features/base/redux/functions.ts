import _ from 'lodash';

import { IReduxState, IStore } from '../../app/types';
import { IStateful } from '../app/types';

/**
 * Sets specific properties of a specific state to specific values and prevents
 * unnecessary state changes.
 *
 * @param {T} target - The state on which the specified properties are to
 * be set.
 * @param {T} source - The map of properties to values which are to be set
 * on the specified target.
 * @returns {T} The specified target if the values of the specified
 * properties equal the specified values; otherwise, a new state constructed
 * from the specified target by setting the specified properties to the
 * specified values.
 */
export function assign<T extends Object>(target: T, source: Partial<T>): T {
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
 * Sets a specific property of a specific state to a specific value. Prevents
 * unnecessary state changes (when the specified {@code value} is equal to the
 * value of the specified {@code property} of the specified {@code state}).
 *
 * @param {T} state - The (Redux) state from which a new state is to be
 * constructed by setting the specified {@code property} to the specified
 * {@code value}.
 * @param {string} property - The property of {@code state} which is to be
 * assigned the specified {@code value} (in the new state).
 * @param {*} value - The value to assign to the specified {@code property}.
 * @returns {T} The specified {@code state} if the value of the specified
 * {@code property} equals the specified <tt>value/tt>; otherwise, a new state
 * constructed from the specified {@code state} by setting the specified
 * {@code property} to the specified {@code value}.
 */
export function set<T extends Object>(state: T, property: keyof T, value: any): T {
    return _set(state, property, value, /* copyOnWrite */ true);
}

/**
 * Sets a specific property of a specific state to a specific value. Prevents
 * unnecessary state changes (when the specified {@code value} is equal to the
 * value of the specified {@code property} of the specified {@code state}).
 *
 * @param {T} state - The (Redux) state from which a state is to be
 * constructed by setting the specified {@code property} to the specified
 * {@code value}.
 * @param {string} property - The property of {@code state} which is to be
 * assigned the specified {@code value}.
 * @param {*} value - The value to assign to the specified {@code property}.
 * @param {boolean} copyOnWrite - If the specified {@code state} is to not be
 * modified, {@code true}; otherwise, {@code false}.
 * @returns {T} The specified {@code state} if the value of the specified
 * {@code property} equals the specified <tt>value/tt> or {@code copyOnWrite}
 * is truthy; otherwise, a new state constructed from the specified
 * {@code state} by setting the specified {@code property} to the specified
 * {@code value}.
 */
function _set<T extends Object>(
        state: T,
        property: keyof T,
        value: any,
        copyOnWrite: boolean): T {
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
 * Whether or not the entity is of type IStore.
 *
 * @param {IStateful} stateful - The entity to check.
 * @returns {boolean}
 */
function isStore(stateful: IStateful): stateful is IStore {
    return 'getState' in stateful && typeof stateful.getState === 'function';
}

/**
 * Returns redux state from the specified {@code stateful} which is presumed to
 * be related to the redux state (e.g. The redux store, the redux
 * {@code getState} function).
 *
 * @param {Function|IStore} stateful - The entity such as the redux store or the
 * redux {@code getState} function from which the redux state is to be
 * returned.
 * @returns {Object} The redux state.
 */
export function toState(stateful: IStateful): IReduxState {
    if (stateful) {
        if (typeof stateful === 'function') {
            return stateful();
        }

        if (isStore(stateful)) {
            return stateful.getState();
        }
    }

    return stateful;
}
