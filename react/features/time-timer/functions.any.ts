import { IReduxState } from '../app/types';
import BaseTheme from '../base/ui/components/BaseTheme';

import { WARNING_THRESHOLD_SECONDS } from './constants';
import { ITimeTimerState } from './reducer';
import { ICalendarTimerEvent, ITimerVisualState } from './types';

// Minimum visible red disk fraction at expiry, so the wedge isn't invisible.
const EXPIRED_WEDGE_FLOOR = 0.02;

/**
 * Derives the disk's visual state (colour, fill fraction, elapsed seconds)
 * from the timer reducer state.
 *
 * @param {ITimeTimerState} state - The current time-timer reducer state.
 * @returns {ITimerVisualState}
 */
export function getTimerVisualState(state: ITimeTimerState): ITimerVisualState {
    const { durationSeconds, remainingSeconds, overSeconds, expired } = state;

    // Time elapsed since the calendar event's scheduled start. Before the
    // scheduled end this is `duration - remaining` (which already accounts
    // for late joiners via `defaultRemaining`). After the scheduled end the
    // timer keeps ticking via `overSeconds`, so total elapsed =
    // duration + overrun.
    const elapsedSeconds = Math.max(
        0,
        (durationSeconds - remainingSeconds) + overSeconds
    );

    // Warning state: within the last `WARNING_THRESHOLD_SECONDS` of the
    // scheduled duration but not yet expired. Used both for the amber
    // colouring and (in middleware) to trigger the one-time bar-expand.
    const warning = !expired && remainingSeconds > 0 && remainingSeconds <= WARNING_THRESHOLD_SECONDS;

    let fillColor = BaseTheme.palette.timeTimerDisk;
    let fraction = durationSeconds > 0
        ? (durationSeconds - remainingSeconds) / durationSeconds
        : 0;

    if (warning) {
        fillColor = BaseTheme.palette.timeTimerWarning;
    }

    let overrunArcEndDeg: number | undefined;

    if (expired) {
        fillColor = BaseTheme.palette.timeTimerExpiredDisk;

        if (durationSeconds > 0) {
            // Treat overrun as a series of laps, each one
            // `durationSeconds` long — the disk fills exactly once over
            // the first lap (matching the original scheduled duration),
            // then stays solid red while a glowing arc sweeps subsequent
            // laps to convey ongoing motion.
            const lapIndex = Math.floor(overSeconds / durationSeconds);
            const lapFraction = (overSeconds % durationSeconds) / durationSeconds;

            if (lapIndex === 0) {
                // Lap 1: standard growing wedge, with a small visible
                // floor right at expiry so the red slice is never invisible.
                fraction = Math.max(EXPIRED_WEDGE_FLOOR, lapFraction);
            } else {
                // Lap 2+: disk fully filled. The leading edge of the
                // current lap is rendered separately as a glowing
                // comet-tail arc (see Disk component).
                fraction = 1;
                overrunArcEndDeg = lapFraction * 360;
            }
        } else {
            fraction = EXPIRED_WEDGE_FLOOR;
        }
    }

    return { elapsedSeconds, fillColor, fraction, overrunArcEndDeg, warning };
}

/**
 * Computes the {@code setCalendarTimerDuration} arguments for a calendar
 * event the user is about to join, or {@code undefined} when the event has
 * no parseable start/end (so the caller should clear any stale duration
 * instead). Shared by web's and native's calendar list `_onPress`, so both
 * platforms record the same duration/start-time the same way.
 *
 * @param {ICalendarTimerEvent} [event] - The calendar event being joined.
 * @returns {{ durationSeconds: number, startTimeUnix: number }|undefined}
 */
export function computeCalendarTimerDuration(event?: ICalendarTimerEvent) {
    const startUnix = typeof event?.startDate === 'number'
        ? event.startDate
        : Date.parse(event?.startDate ?? '');
    const endUnix = typeof event?.endDate === 'number'
        ? event.endDate
        : Date.parse(event?.endDate ?? '');

    if (!isNaN(startUnix) && !isNaN(endUnix) && endUnix > startUnix) {
        return {
            durationSeconds: Math.round((endUnix - startUnix) / 1000),
            startTimeUnix: startUnix
        };
    }

    return undefined;
}

/**
 * Whether the time-timer is enabled. It is enabled by default — only an
 * explicit {@code timeTimer.enabled === false} turns it off. The timer
 * renders nothing until a duration is known, so being on by default is
 * harmless and lets calendar / iframe-API deployments see it with no extra
 * config. This is the single source of truth for the enabled rule; use it
 * everywhere (middleware, components) rather than reading the config inline.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isTimeTimerEnabled(state: IReduxState): boolean {
    return state['features/base/config']?.timeTimer?.enabled !== false;
}

/**
 * Whether the meeting has run past its scheduled end and the user has not yet
 * dismissed the timer-ended notification. Drives the red border around the
 * conference grid.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isTimeTimerExpiredUnacknowledged(state: IReduxState): boolean {
    const { acknowledged, expired } = state['features/time-timer'];

    return expired && !acknowledged;
}
