import { DEFAULT_DURATION_SECONDS } from './constants';
import { START_TIME_TIMER, STOP_TIME_TIMER } from './actionTypes';

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
