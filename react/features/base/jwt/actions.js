// @flow

import { SET_CALLEE_INFO_VISIBLE, SET_JWT } from './actionTypes';

/**
 * Sets the visibility of {@code CalleeInfo}.
 *
 * @param {boolean|undefined} [calleeInfoVisible] - If {@code CalleeInfo} is
 * to be displayed/visible, then {@code true}; otherwise, {@code false} or
 * {@code undefined}.
 * @returns {{
 *     type: SET_CALLEE_INFO_VISIBLE,
 *     calleeInfoVisible: (boolean|undefined)
 * }}
 */
export function setCalleeInfoVisible(calleeInfoVisible: ?boolean) {
    return (dispatch: Dispatch<*>, getState: Function) => {
        getState()['features/base/jwt']
            .calleeInfoVisible === calleeInfoVisible
            || dispatch({
                type: SET_CALLEE_INFO_VISIBLE,
                calleeInfoVisible
            });
    };
}

/**
 * Stores a specific JSON Web Token (JWT) into the redux store.
 *
 * @param {string} [jwt] - The JSON Web Token (JWT) to store.
 * @returns {{
 *     type: SET_TOKEN_DATA,
 *     jwt: (string|undefined)
 * }}
 */
export function setJWT(jwt: ?string) {
    return {
        type: SET_JWT,
        jwt
    };
}
