import ReducerRegistry from "../../../../redux/ReducerRegistry";
import {
    MeetingActionTypes,
    SET_CURRENT_ROOM,
    SET_PLAN_NAME,
    SET_USER_TIER,
    UPDATE_MEETING_CONFIG
} from "./actionTypes";
import { MeetingState } from "./types";

/**
 * Default state for the meeting feature
 */
const DEFAULT_STATE: MeetingState = {
    enabled: false,
    paxPerCall: 0,
    currentRoomId: null,
    planName: null,
    userTier: null,
};

/**
 * The Redux namespace for the meeting feature
 */
export const MEETING_REDUCER = "features/meeting";

/**
 * Reducer for the meeting feature
 *
 * @param state
 * @param action
 * @returns New state
 */
export const meetingReducer = (state: MeetingState = DEFAULT_STATE, action: MeetingActionTypes): MeetingState => {
    switch (action.type) {
        case UPDATE_MEETING_CONFIG: {
            return {
                ...state,
                enabled: action.payload.enabled,
                paxPerCall: action.payload.paxPerCall,
            };
        }

        case SET_CURRENT_ROOM: {
            return {
                ...state,
                currentRoomId: action.payload.roomId,
            };
        }

        case SET_PLAN_NAME: {
            return {
                ...state,
                planName: action.payload.planName,
            };
        }

        case SET_USER_TIER: {
            return {
                ...state,
                userTier: action.payload.userTier,
            };
        }

        default:
            return state;
    }
};

ReducerRegistry.register<MeetingState>(MEETING_REDUCER, meetingReducer);
