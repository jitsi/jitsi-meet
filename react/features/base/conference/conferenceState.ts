/**
 * Tracks whether the user manually left the conference (clicked hangup button).
 */
let isLeaveConferenceManually = false;

/**
 * Sets the manual leave conference state
 *
 * @param isLeaving
 */
export const setLeaveConferenceManually = (isLeaving: boolean): void => {
    isLeaveConferenceManually = isLeaving;
};

/**
 * Gets the current manual leave conference state
 *
 * @returns True if user is manually leaving conference, false otherwise
 */
export const isLeavingConferenceManually = (): boolean => isLeaveConferenceManually;
