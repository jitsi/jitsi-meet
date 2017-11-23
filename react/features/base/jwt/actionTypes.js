/**
 * The type of redux action which sets the visibility of {@code CalleeInfo}.
 *
 * {
 *     type: SET_CALLEE_INFO_VISIBLE,
 *     calleeInfoVisible: boolean
 * }
 */
export const SET_CALLEE_INFO_VISIBLE = Symbol('SET_CALLEE_INFO_VISIBLE');

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
