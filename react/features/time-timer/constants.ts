export const TIME_TIMER_NOTIFICATION_ID = 'time-timer-ended';

/**
 * `type` of the json-message the `mod_time_restricted` Prosody plugin
 * broadcasts at the meeting's half-way point. It is sent from the room JID, so
 * lib-jitsi-meet surfaces it as a NON_PARTICIPANT_MESSAGE_RECEIVED (a
 * server-originated message, not a participant's), which the time-timer
 * middleware turns into a `startTimeTimer` for the server-enforced limit.
 */
export const TIME_RESTRICTED_MESSAGE_TYPE = 'time_restricted';

/**
 * Threshold (seconds remaining) at which the timer enters its "warning"
 * state: the disk + elapsed digits flip to amber and the pill briefly
 * expands to draw the user's attention to the final stretch.
 */
export const WARNING_THRESHOLD_SECONDS = 300; // 5 minutes
