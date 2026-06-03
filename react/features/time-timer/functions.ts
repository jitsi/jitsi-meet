import { WARNING_THRESHOLD_SECONDS } from './constants';
import { ITimeTimerState } from './reducer';

/**
 * Minimum visible fraction of the disk drawn in red right after the timer
 * expires. Without this floor, the wedge would start at ~0 and be invisible
 * for the first several minutes of overrun; a small floor keeps the red
 * slice visible from the moment the timer ends. Real overrun catches up
 * once `overSeconds / durationSeconds` exceeds this floor.
 */
const EXPIRED_WEDGE_FLOOR = 0.02;

/**
 * Soft pink/rose used for the elapsed-time digits in the pill once the
 * meeting is over schedule. Reads well on the pill's dark background.
 */
export const EXPIRED_PILL_TEXT_COLOR = '#FF9DA0';

/**
 * Amber used for the disk fill and the remaining-time digits during the
 * final {@code WARNING_THRESHOLD_SECONDS} of the meeting. Matches the
 * Figma amber-state spec.
 */
export const WARNING_COLOR = '#F8AE1A';

/**
 * Background colours for the amber/warning state — mirror the blue baseline
 * pattern (right segment is the deeper one).
 */
export const WARNING_NAME_SEGMENT_BG = '#3C2E1D';
export const WARNING_TIMER_SEGMENT_BG = '#302417';

/**
 * Background colours for the red/expired state — same lighter-left /
 * deeper-right pattern as the other states, in warm wine tones.
 */
export const EXPIRED_NAME_SEGMENT_BG = '#4F2627';
export const EXPIRED_TIMER_SEGMENT_BG = '#3E1D1E';

/**
 * Coral-red used for the disk fill once the meeting is over schedule —
 * matches Figma's expired-state spec. Stronger / warmer than the previous
 * `theme.palette.iconError`.
 */
export const EXPIRED_DISK_COLOR = '#F24D5F';

/**
 * Deep wine red the overrun lap-2+ sweep darkens toward at its leading
 * edge. Once the disk is fully filled (lap 1 complete), each subsequent
 * lap is drawn as a continuous conic gradient running from
 * {@code EXPIRED_DISK_COLOR} at the 12 o'clock origin to this darker tone
 * at the current leading edge — conveying ongoing motion without leaving
 * the red family. See {@code TimeTimerPill} / {@code Disk}.
 */
export const EXPIRED_OVERRUN_EDGE_COLOR = '#8E2530';

/**
 * Bright 8x8 blue used for the disk in the normal/running state — matches
 * the Figma spec for the time-timer pill baseline.
 */
export const DISK_BLUE = '#1084FE';

/**
 * Disk-red used for the overrun-time text in the "Timer ended" notification.
 * Matches the colour of the disk's expired wedge — same hex as
 * `theme.palette.iconError` resolves to in the current Jitsi theme — and
 * reads with stronger contrast on the notification's white background.
 */
export const EXPIRED_NOTIFICATION_TEXT_COLOR = '#D83848';

export interface ITimerVisualState {

    /**
     * Time elapsed since the calendar event's scheduled start, in seconds.
     * Derived so that every participant sees the same value regardless of
     * when they joined.
     */
    elapsedSeconds: number;

    /**
     * Fill colour for the disk (white during the meeting, amber during the
     * final {@code WARNING_THRESHOLD_SECONDS}, red once over schedule).
     */
    fillColor: string;

    /**
     * Fraction of the disk to fill (0..1).
     */
    fraction: number;

    /**
     * Angular position (degrees, clockwise from the top / 12 o'clock) of
     * the leading edge of the overrun sweep during lap 2 and onward — once
     * the disk has filled once, subsequent overrun laps draw a continuous
     * conic gradient (base red → darker red at this angle) over the solid
     * disk to make the ongoing motion visible. `undefined` during normal
     * running, warning and the first overrun lap (which still uses the
     * standard growing wedge).
     */
    overrunArcEndDeg?: number;

    /**
     * True during the warning window — the final
     * {@code WARNING_THRESHOLD_SECONDS} before scheduled end. Drives the
     * amber colour treatment in the pill (disk + elapsed digits).
     */
    warning: boolean;
}

/**
 * Derives the visual state of the time-timer disk (color + fill fraction +
 * elapsed seconds) from the timer reducer state. Consumed by
 * {@code TimeTimerPill}.
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

    let fillColor = DISK_BLUE; // Bright blue during normal running state.
    let fraction = durationSeconds > 0
        ? (durationSeconds - remainingSeconds) / durationSeconds
        : 0;

    if (warning) {
        fillColor = WARNING_COLOR;
    }

    let overrunArcEndDeg: number | undefined;

    if (expired) {
        fillColor = EXPIRED_DISK_COLOR;

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
