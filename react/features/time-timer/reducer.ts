import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    SET_CALENDAR_DURATION,
    SET_TIME_TIMER_ACKNOWLEDGED,
    SET_TIME_TIMER_EXPIRED,
    SET_TIME_TIMER_WARNING_TRIGGERED,
    START_TIME_TIMER,
    STOP_TIME_TIMER,
    TICK_TIME_TIMER
} from './actionTypes';
import { DEFAULT_DURATION_SECONDS, WARNING_THRESHOLD_SECONDS } from './constants';

export interface ITimeTimerState {
    acknowledged: boolean;
    calendarDurationSeconds?: number;

    /**
     * Scheduled start of the calendar event (ms since epoch) the participant
     * is joining, when supplied by a native calendar source. Lets the
     * middleware compute elapsed-since-start at join time.
     */
    calendarStartTimeUnix?: number;
    durationSeconds: number;
    expired: boolean;
    overSeconds: number;
    remainingSeconds: number;
    running: boolean;
    warningTriggered: boolean;
}

const DEFAULT_STATE: ITimeTimerState = {
    acknowledged: false,
    durationSeconds: DEFAULT_DURATION_SECONDS,
    expired: false,
    overSeconds: 0,
    remainingSeconds: DEFAULT_DURATION_SECONDS,
    running: false,
    warningTriggered: false
};

ReducerRegistry.register<ITimeTimerState>('features/time-timer', (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case SET_CALENDAR_DURATION:
        return {
            ...state,
            calendarDurationSeconds: action.durationSeconds,
            calendarStartTimeUnix: action.startTimeUnix
        };
    case START_TIME_TIMER: {
        const { durationSeconds } = action;

        // `elapsedSeconds` is seconds since the scheduled start and is the
        // single source of truth — it may exceed the duration when a
        // participant joins after the scheduled end. Derive everything else:
        //   remaining = how much of the duration is left (0 once past end)
        //   over      = how far past the scheduled end we are (0 before end)
        //   expired   = we're at or past the scheduled end
        // This is what lets a late joiner land directly in the correct
        // overrun / lap state instead of the timer disabling itself.
        const elapsedSeconds = Math.max(0, action.elapsedSeconds);
        const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);
        const overSeconds = Math.max(0, elapsedSeconds - durationSeconds);
        const expired = elapsedSeconds >= durationSeconds;

        return {
            ...state,
            acknowledged: false,
            durationSeconds,
            expired,
            overSeconds,
            remainingSeconds,
            running: true,

            // Suppress the one-time attention-grab expand if we joined already
            // inside the warning window or past the end — the disk just shows
            // the correct colour from the start. `warningTriggered` only gates
            // the animation, not the colour.
            warningTriggered: remainingSeconds <= WARNING_THRESHOLD_SECONDS
        };
    }
    case STOP_TIME_TIMER:
        return {
            ...state,
            running: false
        };
    case SET_TIME_TIMER_EXPIRED:
        return {
            ...state,
            expired: true
        };
    case SET_TIME_TIMER_ACKNOWLEDGED:
        return {
            ...state,
            acknowledged: true
        };
    case SET_TIME_TIMER_WARNING_TRIGGERED:
        return {
            ...state,
            warningTriggered: true
        };
    case TICK_TIME_TIMER:
        if (state.remainingSeconds > 0) {
            return {
                ...state,
                remainingSeconds: state.remainingSeconds - 1
            };
        }

        // Past the scheduled end — count the overrun upward.
        return {
            ...state,
            overSeconds: state.overSeconds + 1,
            remainingSeconds: 0
        };
    }

    return state;
});
