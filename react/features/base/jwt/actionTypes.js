/**
 * The type of redux action which sets the visibility of {@code CallOverlay}.
 *
 * {
 *     type: SET_CALL_OVERLAY_VISIBLE,
 *     callOverlayVisible: boolean
 * }
 */
export const SET_CALL_OVERLAY_VISIBLE = Symbol('SET_CALL_OVERLAY_VISIBLE');

/**
 * The type of redux action which stores a specific JSON Web Token (JWT) into
 * the redux store.
 *
 * {
 *     type: SET_JWT,
 *     jwt: string
 * }
 */
export const SET_JWT = Symbol('SET_JWT');
