// @vitest-environment happy-dom

import { AnyAction, Reducer, createStore } from 'redux';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import MiddlewareRegistry from './MiddlewareRegistry';
import PersistenceRegistry from './PersistenceRegistry';

import './middleware';

/**
 * Longer than the delay with which the middleware persists the state, so that advancing the clock by it leaves no
 * persist pending and the throttle idle.
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
    const visibilityState = vi.spyOn(document, 'visibilityState', 'get');

    /**
     * Makes the document report the given visibility and announces the change, as the browser does when the tab is
     * hidden or shown.
     *
     * @param {DocumentVisibilityState} state - The new visibility of the document.
     * @returns {void}
     */
    function changeVisibility(state: DocumentVisibilityState) {
        visibilityState.mockReturnValue(state);
        document.dispatchEvent(new Event('visibilitychange'));
    }

    beforeAll(() => {
        // One clock for all the tests. The throttle of the middleware lives as long as the module and remembers when
        // it was last called, so a clock that starts over in every test would make its behaviour depend on the order
        // of the tests.
        vi.useFakeTimers();
    });

    afterAll(() => {
        vi.useRealTimers();
    });

    beforeEach(() => {
        // Nothing is pending and the throttle is idle, so the first state change of a test is persisted right away.
        vi.advanceTimersByTime(LONGER_THAN_PERSIST_DELAY);
        persistState.mockReset();
        persistState.mockImplementation(() => undefined);
    });

    it('persists a pending state change when the page is left', () => {
        const store = createStore(counterReducer, MiddlewareRegistry.applyMiddleware());

        store.dispatch({ type: 'INCREMENT' });
        store.dispatch({ type: 'INCREMENT' });
        store.dispatch({ type: 'INCREMENT' });

        // The first change is persisted right away, the other two wait for the delay.
        expect(persistState).toHaveBeenCalledTimes(1);
        expect(persistState).toHaveBeenLastCalledWith({ count: 1 });

        window.dispatchEvent(new Event('pagehide'));

        expect(persistState).toHaveBeenCalledTimes(2);
        expect(persistState).toHaveBeenLastCalledWith({ count: 3 });
    });

    it('persists a state change that a capturing listener makes when the page is left', () => {
        const store = createStore(counterReducer, MiddlewareRegistry.applyMiddleware());

        store.dispatch({ type: 'INCREMENT' });
        store.dispatch({ type: 'INCREMENT' });

        // The cleanup of a conference is such a listener. It is added long after the middleware was loaded and it
        // changes the state (the duration in the recent list) on the same event.
        window.addEventListener('pagehide', () => store.dispatch({ type: 'INCREMENT' }), {
            capture: true,
            once: true
        });
        window.dispatchEvent(new Event('pagehide'));

        expect(persistState).toHaveBeenLastCalledWith({ count: 3 });
    });

    it('persists a pending state change when the tab is hidden', () => {
        const store = createStore(counterReducer, MiddlewareRegistry.applyMiddleware());

        store.dispatch({ type: 'INCREMENT' });
        store.dispatch({ type: 'INCREMENT' });

        changeVisibility('hidden');

        expect(persistState).toHaveBeenCalledTimes(2);
        expect(persistState).toHaveBeenLastCalledWith({ count: 2 });
    });

    it('leaves a pending state change to the delay when the tab is shown again', () => {
        const store = createStore(counterReducer, MiddlewareRegistry.applyMiddleware());

        store.dispatch({ type: 'INCREMENT' });
        store.dispatch({ type: 'INCREMENT' });

        changeVisibility('visible');

        expect(persistState).toHaveBeenCalledTimes(1);
        expect(persistState).toHaveBeenLastCalledWith({ count: 1 });
    });
});
