import {
    SET_CALENDAR_DURATION,
    SET_TIME_TIMER_ACKNOWLEDGED,
    SET_TIME_TIMER_EXPIRED,
    SET_TIME_TIMER_WARNING_TRIGGERED,
    START_TIME_TIMER,
    STOP_TIME_TIMER
} from './actionTypes';
import { DEFAULT_DURATION_SECONDS } from './constants';

/**
 * Starts the time-timer.
 *
 * @param {number} durationSeconds - The meeting's scheduled duration.
 * @param {number} elapsedSeconds - Seconds elapsed since the scheduled
 * start. MAY exceed durationSeconds (late joiner past the scheduled end) —
 * the reducer derives remaining / overrun / expired from this value.
 * @returns {Object}
 */
export function startTimeTimer(
        durationSeconds: number = DEFAULT_DURATION_SECONDS,
        elapsedSeconds = 0) {
    return {
        type: START_TIME_TIMER,
        durationSeconds,
        elapsedSeconds
    };
}

export function stopTimeTimer() {
    return {
        type: STOP_TIME_TIMER
    };
}

/**
 * Records the duration (and optionally the scheduled start time) of the
 * calendar event the participant is about to join, so the time-timer can
 * derive duration + elapsed from a native calendar source — independent of
 * any iframe-API embedder. Mirrors the `configOverwrite.timeTimer` channel:
 * the timer core stays source-agnostic, this is just one more way to feed it.
 *
 * @param {number|undefined} durationSeconds - Scheduled duration in seconds.
 * @param {number|undefined} startTimeUnix - Scheduled start, ms since epoch.
 * When provided, the middleware computes `elapsed = now - start` at join so
 * late joiners land in the correct (possibly overrun) state.
 * @returns {Object}
 */
export function setCalendarTimerDuration(
        durationSeconds: number | undefined,
        startTimeUnix?: number) {
    return {
        type: SET_CALENDAR_DURATION,
        durationSeconds,
        startTimeUnix
    };
}

export function setTimeTimerExpired() {
    return {
        type: SET_TIME_TIMER_EXPIRED
    };
}

export function setTimeTimerAcknowledged() {
    return {
        type: SET_TIME_TIMER_ACKNOWLEDGED
    };
}

export function setTimeTimerWarningTriggered() {
    return {
        type: SET_TIME_TIMER_WARNING_TRIGGERED
    };
}
