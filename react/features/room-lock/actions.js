import { setPassword } from '../base/conference';

import { BEGIN_ROOM_LOCK_REQUEST, END_ROOM_LOCK_REQUEST } from './actionTypes';
import './reducer';

/**
 * Begins a (user) request to lock a specific conference/room.
 *
 * @param {JitsiConference|undefined} conference - The JitsiConference to lock
 * if specified or undefined if the current JitsiConference is to be locked.
 * @returns {Function}
 */
export function beginRoomLockRequest(conference) {
    return (dispatch, getState) => {
        if (typeof conference === 'undefined') {
            const state = getState();

            // eslint-disable-next-line no-param-reassign
            conference = state['features/base/conference'].conference;
        }

        if (conference) {
            dispatch({
                type: BEGIN_ROOM_LOCK_REQUEST,
                conference
            });
        }
    };
}

/**
 * Ends a (user) request to lock a specific conference/room.
 *
 * @param {JitsiConference} conference - The JitsiConference to lock.
 * @param {string|undefined} password - The password with which the specified
 * conference is to be locked or undefined to cancel the (user) request to lock
 * the specified conference.
 * @returns {Function}
 */
export function endRoomLockRequest(conference, password) {
    return dispatch => {
        const setPassword_
            = password
                ? dispatch(setPassword(conference, conference.lock, password))
                : Promise.resolve();
        const endRoomLockRequest_ = () => {
            dispatch({
                type: END_ROOM_LOCK_REQUEST,
                conference,
                password
            });
        };

        setPassword_.then(endRoomLockRequest_, endRoomLockRequest_);
    };
}
