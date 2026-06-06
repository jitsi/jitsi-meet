import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    SET_TIME_TIMER_ACKNOWLEDGED,
    SET_TIME_TIMER_CALENDAR_DURATION,
    SET_TIME_TIMER_EXPIRED,
    SET_TIME_TIMER_WARNING_TRIGGERED,
    START_TIME_TIMER,
    STOP_TIME_TIMER,
    TICK_TIME_TIMER
} from './actionTypes';
import { WARNING_THRESHOLD_SECONDS } from './constants';

export interface ITimeTimerState {
    acknowledged: boolean;
    calendarDurationSeconds?: number;

    /**
     * Scheduled start of the calendar event (ms since epoch) the participant
     * is joining, when supplied by a native calendar source. Lets the
     * middleware compute elapsed-since-start at join time.
     */
    calendarStartTimeUnix?: number;

    /**
     * Room URL the calendar duration was recorded for. The middleware only
     * uses the duration when the joined conference matches this URL, so a
     * duration left over from a meeting the user opened but never joined does
     * not leak into a different meeting.
     */
    calendarUrl?: string;
    durationSeconds: number;
    expired: boolean;
    overSeconds: number;
    remainingSeconds: number;
    running: boolean;

    /**
     * Wall-clock time (ms since epoch) of the meeting's scheduled end. This is
     * the single source of truth while the timer runs: `remainingSeconds` and
     * `overSeconds` are recomputed from it against `Date.now()` on every tick,
     * so a throttled background tab can never accumulate drift.
     */
    scheduledEndUnix?: number;
    warningTriggered: boolean;
}

const DEFAULT_STATE: ITimeTimerState = {
    acknowledged: false,
    durationSeconds: 0,
    expired: false,
    overSeconds: 0,
    remainingSeconds: 0,
    running: false,
    warningTriggered: false
};

/**
 * Derives the running counters (remaining / over / expired) from the
 * scheduled-end timestamp and a wall-clock reading. Keeping this in one place
 * means START and TICK stay consistent.
 *
 * @param {number} durationSeconds - The meeting's scheduled duration.
 * @param {number} scheduledEndUnix - Scheduled end, ms since epoch.
 * @param {number} nowUnix - Current wall-clock time, ms since epoch.
 * @returns {{ expired: boolean, overSeconds: number, remainingSeconds: number }}
 */
function _deriveCounters(durationSeconds: number, scheduledEndUnix: number, nowUnix: number) {
    const remainingSeconds = Math.max(0, Math.round((scheduledEndUnix - nowUnix) / 1000));
    const overSeconds = Math.max(0, Math.round((nowUnix - scheduledEndUnix) / 1000));

    return {
        expired: remainingSeconds <= 0,
        overSeconds,
        remainingSeconds: Math.min(remainingSeconds, durationSeconds)
    };
}

ReducerRegistry.register<ITimeTimerState>('features/time-timer', (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case SET_TIME_TIMER_CALENDAR_DURATION:
        return {
            ...state,
            calendarDurationSeconds: action.durationSeconds,
            calendarStartTimeUnix: action.startTimeUnix,
            calendarUrl: action.url
        };
    case START_TIME_TIMER: {
        const { durationSeconds, nowUnix } = action;

        // `elapsedSeconds` is seconds since the scheduled start and may exceed
        // the duration (joining after the scheduled end). From it and the
        // current wall-clock time we pin the scheduled end as an absolute
        // timestamp; everything else is derived from that timestamp, both here
        // and on every subsequent tick. This is what lets a late joiner land
        // directly in the correct overrun / lap state.
        const elapsedSeconds = Math.max(0, action.elapsedSeconds);
        const scheduledEndUnix = nowUnix + ((durationSeconds - elapsedSeconds) * 1000);
        const counters = _deriveCounters(durationSeconds, scheduledEndUnix, nowUnix);

        return {
            ...state,
            acknowledged: false,
            durationSeconds,
            ...counters,
            running: true,
            scheduledEndUnix,

            // Suppress the one-time attention-grab expand if we joined already
            // inside the warning window or past the end — the disk just shows
            // the correct colour from the start. `warningTriggered` only gates
            // the animation, not the colour.
            warningTriggered: counters.remainingSeconds <= WARNING_THRESHOLD_SECONDS
        };
    }
    case STOP_TIME_TIMER:
        // Full reset of the derived/running state so a stopped or cleared
        // timer leaves nothing behind — no frozen pill, no lingering red
        // border on the next meeting. Calendar inputs are managed separately
        // by SET_TIME_TIMER_CALENDAR_DURATION and intentionally not touched
        // here.
        return {
            ...state,
            acknowledged: false,
            durationSeconds: 0,
            expired: false,
            overSeconds: 0,
            remainingSeconds: 0,
            running: false,
            scheduledEndUnix: undefined,
            warningTriggered: false
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
    case TICK_TIME_TIMER: {
        if (!state.running || typeof state.scheduledEndUnix !== 'number') {
            return state;
        }

        return {
            ...state,
            ..._deriveCounters(state.durationSeconds, state.scheduledEndUnix, action.nowUnix)
        };
    }
    }

    return state;
});
