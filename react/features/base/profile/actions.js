import { PROFILE_UPDATED } from './actionTypes';

/**
 * Create an action for when the local profile is updated.
 *
 * @param {Object} profile - The new profile data.
 * @returns {{
 *     type: UPDATE_PROFILE,
 *     profile: {
 *         displayName: string,
 *         defaultURL: URL,
 *         email: string,
 *         startWithAudioMuted: boolean,
 *         startWithVideoMuted: boolean
 *     }
 * }}
 */
export function updateProfile(profile) {
    return {
        type: PROFILE_UPDATED,
        profile
    };
}
