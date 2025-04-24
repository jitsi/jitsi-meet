/**
 * Updates the meeting configuration
 */
export const UPDATE_MEETING_CONFIG = "UPDATE_MEETING_CONFIG";

/**
 * Sets the current active meeting room ID
 */
export const SET_CURRENT_ROOM = "SET_CURRENT_ROOM";

/**
 * Action type definitions
 */
interface UpdateMeetingConfigAction {
    type: typeof UPDATE_MEETING_CONFIG;
    payload: {
        enabled: boolean;
        paxPerCall: number;
    };
}

interface SetCurrentRoomAction {
    type: typeof SET_CURRENT_ROOM;
    payload: {
        roomId: string | null;
    };
}

export type MeetingActionTypes = UpdateMeetingConfigAction | SetCurrentRoomAction;
