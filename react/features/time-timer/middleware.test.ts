import { AnyAction, Store, createStore } from 'redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { IReduxState } from '../app/types';
import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT,
    CONFERENCE_WILL_JOIN
} from '../base/conference/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import ReducerRegistry from '../base/redux/ReducerRegistry';

import { TICK_TIME_TIMER } from './actionTypes';
import { startTimeTimer } from './actions';

import './middleware';
import './reducer';

// Keep the import graph away from the conference, the toolbox and the UI, which need a running app.
vi.mock('../base/conference/functions', () => ({ getRoomName: () => 'room' }));
vi.mock('../notifications/actions', () => ({ showNotification: () => ({ type: 'SHOW_NOTIFICATION' }) }));
vi.mock('../toolbox/actions', () => ({ showToolbox: () => ({ type: 'SHOW_TOOLBOX' }) }));
vi.mock('./functions', () => {
    return {
        buildTimerEndedDescription: () => 'ended',
        isTimeTimerEnabled: () => true
    };
});
vi.mock('./logger', () => ({ default: { info: vi.fn() } }));

/**
 * A minimal stand-in for the base/conference reducer: the joining and the joined conference, which CONFERENCE_FAILED
 * and CONFERENCE_LEFT clear.
 *
 * @param {Object} state - The current state.
 * @param {AnyAction} action - The dispatched action.
 * @returns {Object}
 */
const conferenceReducer = (state: { conference?: object; joining?: object; } = {}, action: AnyAction) => {
    switch (action.type) {
    case CONFERENCE_WILL_JOIN:
        return { joining: action.conference };
    case CONFERENCE_JOINED:
        return { conference: action.conference };
    case CONFERENCE_FAILED:
    case CONFERENCE_LEFT:
        return action.conference === state.conference || action.conference === state.joining ? {} : state;
    }

    return state;
};

const ONE_HOUR = 3600;

describe('time-timer middleware', () => {
    let actions: AnyAction[];
    let store: Store;

    const timer = () => (store.getState() as IReduxState)['features/time-timer'];
    const ticks = () => actions.filter(({ type }) => type === TICK_TIME_TIMER).length;

    beforeEach(() => {
        vi.useFakeTimers();
        actions = [];

        const recorder = () => (next: Function) => (action: AnyAction) => {
            actions.push(action);

            return next(action);
        };

        store = createStore(
            ReducerRegistry.combineReducers({ 'features/base/conference': conferenceReducer }),
            MiddlewareRegistry.applyMiddleware(recorder));
    });

    afterEach(() => {
        // Stop the tick interval a test left running.
        store.dispatch({ type: CONFERENCE_LEFT, conference: {} });
        vi.useRealTimers();
    });

    /**
     * Joins a conference and starts the timer in it.
     *
     * @returns {Object} The joined conference.
     */
    const joinWithTimer = () => {
        const conference = {};

        store.dispatch({ type: CONFERENCE_WILL_JOIN, conference });
        store.dispatch({ type: CONFERENCE_JOINED, conference });
        store.dispatch(startTimeTimer(ONE_HOUR));
        expect(timer().running).toBe(true);

        return conference;
    };

    it('stops the timer when the joined conference fails', () => {
        const conference = joinWithTimer();

        store.dispatch({ type: CONFERENCE_FAILED, conference, error: { name: 'conference.destroyed', params: [] } });
        expect(timer().running).toBe(false);

        const ticksAfterFailure = ticks();

        vi.advanceTimersByTime(5000);
        expect(ticks()).toBe(ticksAfterFailure);
    });

    it('keeps a timer set before the join when joining fails', () => {
        const conference = {};

        store.dispatch(startTimeTimer(ONE_HOUR));
        store.dispatch({ type: CONFERENCE_WILL_JOIN, conference });
        store.dispatch({ type: CONFERENCE_FAILED, conference, error: { name: 'conference.passwordRequired' } });

        expect(timer().running).toBe(true);
        vi.advanceTimersByTime(2000);
        expect(ticks()).toBe(2);
    });

    it('keeps the timer of the joined conference when an older conference fails', () => {
        joinWithTimer();

        store.dispatch({ type: CONFERENCE_FAILED, conference: {}, error: { name: 'conference.destroyed' } });

        expect(timer().running).toBe(true);
        vi.advanceTimersByTime(2000);
        expect(ticks()).toBe(2);
    });

    it('still stops the timer when the conference is left', () => {
        const conference = joinWithTimer();

        store.dispatch({ type: CONFERENCE_LEFT, conference });
        expect(timer().running).toBe(false);

        vi.advanceTimersByTime(2000);
        expect(ticks()).toBe(0);
    });
});
