/**
 * The type of redux action which set an avatar URL for delayed loading.
 *
 * {
 *     type: SET_DELAYED_LOAD_OF_AVATAR_URL
 *     avatarUrl: string
 * }
 */
export const SET_DELAYED_LOAD_OF_AVATAR_URL = 'SET_DELAYED_LOAD_OF_AVATAR_URL';

/**
 * The type of redux action which stores a specific JSON Web Token (JWT) into
 * the redux store.
 *
 * {
 *     type: SET_JWT,
 *     jwt: string
 * }
 */
export const SET_JWT = 'SET_JWT';

/**
 * The type of redux action which sets a known avatar URL.
 *
 * {
 *     type: SET_KNOWN_AVATAR_URL,
 *     avatarUrl: string
 * }
 */
export const SET_KNOWN_AVATAR_URL = 'SET_KNOWN_AVATAR_URL';
