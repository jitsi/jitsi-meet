// @vitest-environment happy-dom

import { AnyAction, Reducer, createStore } from 'redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import MiddlewareRegistry from './MiddlewareRegistry';
import PersistenceRegistry from './PersistenceRegistry';

import './middleware';

/**
 * Longer than the delay with which the middleware persists the state, so that advancing the clock by it leaves no
 * persist pending.
 */
const LONGER_THAN_PERSIST_DELAY = 10000;

/**
 * The state of the store used by the tests.
 */
interface ICounterState {

    /**
     * The number of INCREMENT actions that were dispatched.
     */
    count: number;
}

/**
 * A reducer that produces a new state on every INCREMENT action, which is what makes the middleware persist.
 *
 * @param {ICounterState} state - The current state.
 * @param {AnyAction} action - The dispatched action.
 * @returns {ICounterState}
 */
const counterReducer: Reducer<ICounterState, AnyAction> = (state = { count: 0 }, action) => {
    if (action.type === 'INCREMENT') {
        return { count: state.count + 1 };
    }

    return state;
};

describe('state persistence middleware', () => {
    const persistState = vi.spyOn(PersistenceRegistry, 'persistState');

    beforeEach(() => {
        vi.useFakeTimers();
        persistState.mockReset();
        persistState.mockImplementation(() => undefined);
    });

    afterEach(() => {
        // The throttle of the middleware outlives a test, so nothing is left pending for the next one.
        vi.advanceTimersByTime(LONGER_THAN_PERSIST_DELAY);
        vi.useRealTimers();
    });

    it('persists a pending state change when the page is hidden', () => {
        const store = createStore(counterReducer, MiddlewareRegistry.applyMiddleware());

        // Several changes in a row: at most the first one is persisted right away, the rest wait for the delay.
        store.dispatch({ type: 'INCREMENT' });
        store.dispatch({ type: 'INCREMENT' });
        store.dispatch({ type: 'INCREMENT' });

        expect(persistState).not.toHaveBeenLastCalledWith(store.getState());

        window.dispatchEvent(new Event('pagehide'));

        expect(persistState).toHaveBeenLastCalledWith(store.getState());
    });

    it('persists nothing when the page is hidden with no pending change', () => {
        const store = createStore(counterReducer, MiddlewareRegistry.applyMiddleware());

        store.dispatch({ type: 'INCREMENT' });
        vi.advanceTimersByTime(LONGER_THAN_PERSIST_DELAY);
        persistState.mockClear();

        window.dispatchEvent(new Event('pagehide'));

        expect(persistState).not.toHaveBeenCalled();
    });
});
