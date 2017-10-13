// @flow

import { SET_CALL_OVERLAY_VISIBLE, SET_JWT } from './actionTypes';

/**
 * Sets the visibility of {@code CallOverlay}.
 *
 * @param {boolean|undefined} [callOverlayVisible] - If {@code CallOverlay} is
 * to be displayed/visible, then {@code true}; otherwise, {@code false} or
 * {@code undefined}.
 * @returns {{
 *     type: SET_CALL_OVERLAY_VISIBLE,
 *     callOverlayVisible: (boolean|undefined)
 * }}
 */
export function setCallOverlayVisible(callOverlayVisible: ?boolean) {
    return (dispatch: Dispatch<*>, getState: Function) => {
        getState()['features/base/jwt']
            .callOverlayVisible === callOverlayVisible
            || dispatch({
                type: SET_CALL_OVERLAY_VISIBLE,
                callOverlayVisible
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
