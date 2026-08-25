/**
 * The type of (redux) action which records the duration (and optionally the
 * scheduled start + room URL) of the calendar event the participant is about
 * to join, so the timer can be started from a native calendar source on join.
 *
 * {
 *     type: SET_TIME_TIMER_CALENDAR_DURATION,
 *     durationSeconds: number|undefined,
 *     startTimeUnix: number|undefined,
 *     url: string|undefined
 * }
 */
export const SET_TIME_TIMER_CALENDAR_DURATION = 'SET_TIME_TIMER_CALENDAR_DURATION';

/**
 * The type of (redux) action which marks the timer-ended notification as
 * acknowledged (dismissed) by the user.
 *
 * {
 *     type: SET_TIME_TIMER_ACKNOWLEDGED
 * }
 */
export const SET_TIME_TIMER_ACKNOWLEDGED = 'SET_TIME_TIMER_ACKNOWLEDGED';

/**
 * The type of (redux) action which records that the meeting has reached or
 * passed its scheduled end.
 *
 * {
 *     type: SET_TIME_TIMER_EXPIRED
 * }
 */
export const SET_TIME_TIMER_EXPIRED = 'SET_TIME_TIMER_EXPIRED';

/**
 * The type of (redux) action which records that the one-time warning-window
 * attention-grab (bar expand) has fired, so it does not repeat.
 *
 * {
 *     type: SET_TIME_TIMER_WARNING_TRIGGERED
 * }
 */
export const SET_TIME_TIMER_WARNING_TRIGGERED = 'SET_TIME_TIMER_WARNING_TRIGGERED';

/**
 * The type of (redux) action which starts (or restarts) the timer for a
 * meeting of a known duration.
 *
 * {
 *     type: START_TIME_TIMER,
 *     durationSeconds: number,
 *     elapsedSeconds: number,
 *     nowUnix: number
 * }
 */
export const START_TIME_TIMER = 'START_TIME_TIMER';

/**
 * The type of (redux) action which stops the timer and clears its derived
 * state (running / expired / acknowledged / counters).
 *
 * {
 *     type: STOP_TIME_TIMER
 * }
 */
export const STOP_TIME_TIMER = 'STOP_TIME_TIMER';

/**
 * The type of (redux) action dispatched once per second while the timer runs.
 * It carries a fresh wall-clock reading so the reducer recomputes the
 * remaining / overrun time from the stored scheduled-end timestamp rather than
 * counting ticks (which drift when a background tab throttles the interval).
 *
 * {
 *     type: TICK_TIME_TIMER,
 *     nowUnix: number
 * }
 */
export const TICK_TIME_TIMER = 'TICK_TIME_TIMER';
