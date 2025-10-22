/**
 * Interface for the meeting state in Redux
 */
export interface MeetingState {
    /**
     * Whether the meeting feature is enabled for the current user
     */
    enabled: boolean;

    /**
     * Maximum number of participants allowed per call for the current user
     */
    paxPerCall: number;

    /**
     * Current active room ID (if any)
     */
    currentRoomId: string | null;

    /**
     * The name of the user's plan
     */
    planName: string | null;
}
