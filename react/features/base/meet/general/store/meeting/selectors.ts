import { Tier } from "@internxt/sdk/dist/drive/payments/types/tiers";
import { IReduxState } from "../../../../../app/types";
import { MEETING_REDUCER } from "./reducer";

/**
 * Maps technical tier labels to user-friendly display names
 */
const PLAN_NAME_MAP: Record<string, string> = {
    free: "Free",
    essential: "Essential",
    premium: "Premium",
    ultimate: "Ultimate",
    "business-standard": "Business Standard",
    "business-pro": "Business Pro",
    "Internxt Cleaner": "Internxt Cleaner",
    "Internxt Antivirus": "Internxt Antivirus",
    "Internxt VPN": "Internxt VPN",
};

/**
 * Formats a technical plan name into a user-friendly display name
 * Replaces hyphens with spaces and capitalizes the first letter of each word
 *
 * @param planName - The technical plan name (e.g., "business-standard")
 * @returns The formatted plan name (e.g., "Business Standard")
 */
const formatPlanName = (planName: string): string => {
    return planName
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

/**
 * Selector to get the meeting configuration from state
 *
 * @param state - The Redux state
 * @returns The meeting configuration
 */
export const getMeetingConfig = (state: IReduxState): {
    enabled: boolean;
    paxPerCall: number;
} => {
    return {
        enabled: state[MEETING_REDUCER].enabled,
        paxPerCall: state[MEETING_REDUCER].paxPerCall,
    };
};

/**
 * Selector to check if the meeting feature is enabled
 *
 * @param state - The Redux state
 * @returns Whether meeting is enabled
 */
export const isMeetingEnabled = (state: IReduxState): boolean => {
    return state[MEETING_REDUCER].enabled;
};

/**
 * Selector to get the current room ID
 *
 * @param state - The Redux state
 * @returns The current room ID or null
 */
export const getCurrentRoomId = (state: IReduxState): string | null => {
    return state[MEETING_REDUCER].currentRoomId;
};

/**
 * Selector to get the maximum number of participants allowed per call
 *
 * @param state - The Redux state
 * @returns The maximum number of participants
 */
export const getMaxParticipantsPerCall = (state: IReduxState): number => {
    return state[MEETING_REDUCER].paxPerCall;
};

/**
 * Selector to get the user's plan name
 * Maps technical tier labels to user-friendly display names
 * If the plan name is not in the map, it formats it automatically
 *
 * @param state - The Redux state
 * @returns The user-friendly plan name or null
 */
export const getPlanName = (state: IReduxState): string | null => {
    const planName = state[MEETING_REDUCER].planName;

    if (!planName) {
        return null;
    }

    return PLAN_NAME_MAP[planName] ?? formatPlanName(planName);
};

/**
 * Selector to get the user's plan name
 * Maps technical tier labels to user-friendly display names
 * If the plan name is not in the map, it formats it automatically
 *
 * @param state - The Redux state
 * @returns The user-friendly plan name or null
 */
export const getUserTier = (state: IReduxState): Tier | null => {
    const userTier = state[MEETING_REDUCER].userTier;

    if (!userTier) {
        return null;
    }

    return userTier;
};
