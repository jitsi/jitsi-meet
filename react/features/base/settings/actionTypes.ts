/**
 * Create an action for when the settings are updated.
 *
 * {
 *     type: SETTINGS_UPDATED,
 *     settings: {
 *         audioOutputDeviceId: string,
 *         avatarURL: string,
 *         cameraDeviceId: string,
 *         displayName: string,
 *         email: string,
 *         localFlipX: boolean,
 *         micDeviceId: string,
 *         serverURL: string,
 *         showSubtitlesOnStage: boolean,
 *         startAudioOnly: boolean,
 *         startWithAudioMuted: boolean,
 *         startWithVideoMuted: boolean,
 *         startWithReactionsMuted: boolean
 *     }
 * }
 */
export const SETTINGS_UPDATED = 'SETTINGS_UPDATED';
