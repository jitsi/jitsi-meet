/**
 * The type of the Redux action which signals that the prompt for media
 * permission is visible or not.
 *
 * {
 *     type: MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED,
 *     isVisible: {boolean},
 *     browser: {string}
 * }
 * @public
 */
export const MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED
    = 'MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED';
