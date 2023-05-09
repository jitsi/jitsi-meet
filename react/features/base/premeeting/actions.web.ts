import { SET_UNSAFE_ROOM_CONSENT } from './actionTypes';

/**
 * Sets the consent of the user for joining the unsafe room.
 *
 * @param {boolean} consent - The user's consent.
 * @returns {{
 *      type: SET_UNSAFE_ROOM_CONSENT,
*       consent: boolean
* }}
 */
export function setUnsafeRoomConsent(consent: boolean) {
    return {
        type: SET_UNSAFE_ROOM_CONSENT,
        consent
    };
}
