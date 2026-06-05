import { IStore } from '../app/types';

import {
    SET_CALENDAR_DURATION,
    SET_TIME_TIMER_ACKNOWLEDGED,
    SET_TIME_TIMER_EXPIRED,
    SET_TIME_TIMER_WARNING_TRIGGERED,
    START_TIME_TIMER,
    STOP_TIME_TIMER
} from './actionTypes';

/**
 * Starts the time-timer.
 *
 * @param {number} durationSeconds - The meeting's scheduled duration. Always
 * supplied by a real source (a calendar event or the iframe API) — the timer
 * is never started without one.
 * @param {number} elapsedSeconds - Seconds elapsed since the scheduled
 * start. MAY exceed durationSeconds (late joiner past the scheduled end) —
 * the reducer derives remaining / overrun / expired from this value.
 * @returns {Object}
 */
export function startTimeTimer(
        durationSeconds: number,
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
 * Sets (or clears) the meeting timer at runtime from the iframe API
 * `setMeetingTimer` command. This is the channel embedded/JaaS deployments
 * use — the host app (which owns the meeting schedule) pushes the values in,
 * with no calendar or config involved.
 *
 * A positive `durationSeconds` starts/updates the timer; a missing or
 * non-positive duration clears it (so the embedder can turn the timer off
 * for a meeting it has no schedule for).
 *
 * @param {Object} options - Timer parameters from the embedder.
 * @param {number} options.duration - Scheduled duration in seconds.
 * @param {number} [options.elapsed] - Seconds since the scheduled start
 * (may exceed duration for a late joiner). Defaults to 0.
 * @returns {Function}
 */
export function setMeetingTimer({ duration, elapsed = 0 }: { duration?: number; elapsed?: number; } = {}) {
    return (dispatch: IStore['dispatch']) => {
        if (typeof duration === 'number' && duration > 0) {
            dispatch(startTimeTimer(duration, Math.max(0, elapsed)));
        } else {
            dispatch(stopTimeTimer());
        }
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
