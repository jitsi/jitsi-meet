export const TIME_TIMER_NOTIFICATION_ID = 'time-timer-ended';
export const DEFAULT_DURATION_SECONDS = 1500; // 25 minutes

/**
 * Threshold (seconds remaining) at which the timer enters its "warning"
 * state: the disk + elapsed digits flip to amber and the pill briefly
 * expands to draw the user's attention to the final stretch.
 */
export const WARNING_THRESHOLD_SECONDS = 300; // 5 minutes
