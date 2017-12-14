/**
 * Create an action for when the local profile is updated.
 *
 * {
 *     type: PROFILE_UPDATED,
 *     profile: {
 *         displayName: string,
 *         defaultURL: URL,
 *         email: string,
 *         startWithAudioMuted: boolean,
 *         startWithVideoMuted: boolean
 *     }
 * }
 */
export const PROFILE_UPDATED = Symbol('PROFILE_UPDATED');
