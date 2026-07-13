import { IStore } from '../app/types';

import {
    SET_TIME_TIMER_ACKNOWLEDGED,
    SET_TIME_TIMER_CALENDAR_DURATION,
    SET_TIME_TIMER_EXPIRED,
    SET_TIME_TIMER_WARNING_TRIGGERED,
    START_TIME_TIMER,
    STOP_TIME_TIMER,
    TICK_TIME_TIMER
} from './actionTypes';
import { isTimeTimerEnabled } from './functions';

/**
 * Starts the time-timer.
 *
 * @param {number} durationSeconds - The meeting's scheduled duration. Always
 * supplied by a real source (a calendar event or the iframe API) — the timer
 * is never started without one.
 * @param {number} elapsedSeconds - Seconds elapsed since the scheduled
 * start. MAY exceed durationSeconds (late joiner past the scheduled end) —
 * the reducer pins the scheduled end from this value and derives remaining /
 * overrun / expired from timestamps thereafter.
 * @returns {Object}
 */
export function startTimeTimer(
        durationSeconds: number,
        elapsedSeconds = 0) {
    return {
        type: START_TIME_TIMER,
        durationSeconds,
        elapsedSeconds,
        nowUnix: Date.now()
    };
}

export function stopTimeTimer() {
    return {
        type: STOP_TIME_TIMER
    };
}

/**
 * Advances the timer by recomputing its remaining / overrun counters from the
 * stored scheduled-end timestamp against the current wall-clock time. Carrying
 * `nowUnix` keeps the reducer pure and makes the timer immune to background-tab
 * interval throttling.
 *
 * @returns {Object}
 */
export function tickTimeTimer() {
    return {
        type: TICK_TIME_TIMER,
        nowUnix: Date.now()
    };
}

/**
 * Sets (or clears) the meeting timer at runtime from the iframe API
 * `setMeetingTimer` command. This is the channel embedded/JaaS deployments
 * use — the host app (which owns the meeting schedule) pushes the values in,
 * with no calendar or config involved.
 *
 * A positive `duration` starts/updates the timer; a missing or non-positive
 * duration clears it (so the embedder can turn the timer off for a meeting it
 * has no schedule for). The command is ignored entirely when the feature is
 * disabled (`timeTimer.enabled === false`), so a deployment that opts out is
 * never driven into the running / expired state through this path.
 *
 * @param {Object} options - Timer parameters from the embedder.
 * @param {number} options.duration - Scheduled duration in seconds.
 * @param {number} [options.elapsed] - Seconds since the scheduled start.
 * May be negative (the meeting hasn't started yet — the timer sits at the
 * full duration until the start arrives) or exceed the duration (a late
 * joiner, landing directly in the overrun state). Defaults to 0.
 * @returns {Function}
 */
export function setMeetingTimer({ duration, elapsed = 0 }: { duration?: number; elapsed?: number; } = {}) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        if (!isTimeTimerEnabled(getState())) {
            return;
        }

        if (typeof duration === 'number' && duration > 0) {
            dispatch(startTimeTimer(duration, elapsed));
        } else {
            dispatch(stopTimeTimer());
        }
    };
}

/**
 * Records the duration (and optionally the scheduled start time + room URL) of
 * the calendar event the participant is about to join, so the time-timer can
 * derive duration + elapsed from a native calendar source — independent of any
 * iframe-API embedder. Mirrors the `configOverwrite.timeTimer` channel: the
 * timer core stays source-agnostic, this is just one more way to feed it.
 *
 * @param {number|undefined} durationSeconds - Scheduled duration in seconds.
 * @param {Object} [options] - Optional context.
 * @param {number} [options.startTimeUnix] - Scheduled start, ms since epoch.
 * When provided, the middleware computes `elapsed = now - start` at join so
 * late joiners land in the correct (possibly overrun) state.
 * @param {string} [options.url] - The room URL this duration belongs to. The
 * middleware only applies the duration when the joined conference matches, so
 * a duration from a meeting the user opened but never joined cannot leak into
 * a different meeting.
 * @returns {Object}
 */
export function setCalendarTimerDuration(
        durationSeconds: number | undefined,
        { startTimeUnix, url }: { startTimeUnix?: number; url?: string; } = {}) {
    return {
        type: SET_TIME_TIMER_CALENDAR_DURATION,
        durationSeconds,
        startTimeUnix,
        url
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
