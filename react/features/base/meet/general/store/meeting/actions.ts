import { Tier } from "@internxt/sdk/dist/drive/payments/types/tiers";
import { SET_CURRENT_ROOM, SET_PLAN_NAME, SET_USER_TIER, UPDATE_MEETING_CONFIG } from "./actionTypes";

/**
 * Updates the meeting configuration based on the user's subscription tier
 *
 * @param config - Configuration from the user's tier
 * @param config.enabled - Whether the meeting feature is enabled
 * @param config.paxPerCall - Maximum number of participants allowed per call
 * @returns Action object
 */
export function updateMeetingConfig(config: Tier["featuresPerService"]["meet"]): {
    type: string;
    payload: { enabled: boolean; paxPerCall: number };
} {
    return {
        type: UPDATE_MEETING_CONFIG,
        payload: config,
    };
}

/**
 * Sets the current active meeting room ID
 *
 * @param roomId - The ID of the current meeting room
 * @returns Action object
 */
export function setCurrentRoom(roomId: string | null): {
    type: string;
    payload: { roomId: string | null };
} {
    return {
        type: SET_CURRENT_ROOM,
        payload: { roomId },
    };
}

/**
 * Sets the user's plan name
 *
 * @param planName - The name of the user's plan
 * @returns Action object
 */
export function setPlanName(planName: string | null): {
    type: string;
    payload: { planName: string | null };
} {
    return {
        type: SET_PLAN_NAME,
        payload: { planName },
    };
}

/**
 * Sets the user's tier
 *
 * @param userTier - The user's tier
 * @returns Action object
 */
export function setUserTier(userTier: Tier | null): {
    type: string;
    payload: { userTier: Tier | null };
} {
    return {
        type: SET_USER_TIER,
        payload: { userTier },
    };
}
