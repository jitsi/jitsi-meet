import ReducerRegistry from '../base/redux/ReducerRegistry';
import { DEFAULT_DURATION_SECONDS } from './constants';
import { START_TIME_TIMER, STOP_TIME_TIMER, TICK_TIME_TIMER } from './actionTypes';

export interface ITimeTimerState {
    durationSeconds: number;
    remainingSeconds: number;
    running: boolean;
}

const DEFAULT_STATE: ITimeTimerState = {
    durationSeconds: DEFAULT_DURATION_SECONDS,
    remainingSeconds: DEFAULT_DURATION_SECONDS,
    running: false
};

ReducerRegistry.register<ITimeTimerState>('features/time-timer', (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case START_TIME_TIMER:
        return {
            ...state,
            durationSeconds: action.durationSeconds,
            remainingSeconds: action.durationSeconds,
            running: true
        };
    case STOP_TIME_TIMER:
        return {
            ...state,
            running: false
        };
    case TICK_TIME_TIMER:
        return {
            ...state,
            remainingSeconds: Math.max(0, state.remainingSeconds - 1)
        };
    }

    return state;
});
