/**
 * Updates the meeting configuration
 */
export const UPDATE_MEETING_CONFIG = "UPDATE_MEETING_CONFIG";

/**
 * Sets the current active meeting room ID
 */
export const SET_CURRENT_ROOM = "SET_CURRENT_ROOM";

/**
 * Sets the user's plan name
 */
export const SET_PLAN_NAME = "SET_PLAN_NAME";

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

interface SetPlanNameAction {
    type: typeof SET_PLAN_NAME;
    payload: {
        planName: string | null;
    };
}

export type MeetingActionTypes = UpdateMeetingConfigAction | SetCurrentRoomAction | SetPlanNameAction;
