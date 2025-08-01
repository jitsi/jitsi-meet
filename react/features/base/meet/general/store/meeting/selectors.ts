import { IReduxState } from "../../../../../app/types";
import { MEETING_REDUCER } from "./reducer";

/**
 * Selector to get the meeting configuration from state
 *
 * @param state - The Redux state
 * @returns The meeting configuration
 */
export function getMeetingConfig(state: IReduxState): {
    enabled: boolean;
    paxPerCall: number;
} {
    return {
        enabled: state[MEETING_REDUCER].enabled,
        paxPerCall: state[MEETING_REDUCER].paxPerCall,
    };
}

/**
 * Selector to check if the meeting feature is enabled
 *
 * @param state - The Redux state
 * @returns Whether meeting is enabled
 */
export function isMeetingEnabled(state: IReduxState): boolean {
    return state[MEETING_REDUCER].enabled;
}

/**
 * Selector to get the current room ID
 *
 * @param state - The Redux state
 * @returns The current room ID or null
 */
export function getCurrentRoomId(state: IReduxState): string | null {
    return state[MEETING_REDUCER].currentRoomId;
}

/**
 * Selector to get the maximum number of participants allowed per call
 *
 * @param state - The Redux state
 * @returns The maximum number of participants
 */
export function getMaxParticipantsPerCall(state: IReduxState): number {
    return state[MEETING_REDUCER].paxPerCall;
}
