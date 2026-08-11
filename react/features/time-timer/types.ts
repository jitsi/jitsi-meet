/**
 * Visual state of the time-timer disk, derived from the reducer state by
 * {@code getTimerVisualState} and consumed by the pill/disk components.
 */
export interface ITimerVisualState {

    /**
     * Time elapsed since the calendar event's scheduled start, in seconds.
     * Derived so every participant sees the same value regardless of when
     * they joined.
     */
    elapsedSeconds: number;

    /**
     * Disk fill colour (blue running, amber in the warning window, red once
     * over schedule).
     */
    fillColor: string;

    /**
     * Fraction of the disk to fill (0..1).
     */
    fraction: number;

    /**
     * Leading-edge angle (degrees clockwise from 12 o'clock) of the overrun
     * sweep during lap 2+, once the disk has filled once. `undefined` while
     * running, warning, and the first overrun lap (a plain growing wedge).
     */
    overrunArcEndDeg?: number;

    /**
     * True during the warning window — the final
     * {@code WARNING_THRESHOLD_SECONDS} before scheduled end.
     */
    warning: boolean;
}

/**
 * A calendar event, limited to the fields {@code computeCalendarTimerDuration}
 * reads. {@code startDate}/{@code endDate} are already epoch-ms numbers by the
 * time an event reaches redux (see {@code _parseCalendarEntry}); a string is
 * also accepted and coerced in case a raw ISO event is ever passed in directly.
 */
export interface ICalendarTimerEvent {
    endDate?: number | string;
    startDate?: number | string;
    url?: string;
}
