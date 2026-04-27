import { DEFAULT_DURATION_SECONDS } from './constants';
import { SET_CALENDAR_DURATION, START_TIME_TIMER, STOP_TIME_TIMER } from './actionTypes';

export function startTimeTimer(durationSeconds: number = DEFAULT_DURATION_SECONDS) {
    return {
        type: START_TIME_TIMER,
        durationSeconds
    };
}

export function stopTimeTimer() {
    return {
        type: STOP_TIME_TIMER
    };
}

export function setCalendarTimerDuration(durationSeconds: number | undefined) {
    return {
        type: SET_CALENDAR_DURATION,
        durationSeconds
    };
}
