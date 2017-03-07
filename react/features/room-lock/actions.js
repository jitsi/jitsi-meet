import { setPassword } from '../base/conference';
import { openDialog } from '../base/dialog';
import { PasswordRequiredPrompt } from './components';

import { BEGIN_ROOM_LOCK_REQUEST, END_ROOM_LOCK_REQUEST } from './actionTypes';

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

/**
 * Begins a request to enter password for a specific conference/room.
 *
 * @param {JitsiConference} conference - The JitsiConference
 * requesting password.
 * @protected
 * @returns {{
 *     type: BEGIN_DIALOG_REQUEST,
 *     component: Component,
 *     props: React.PropTypes
 * }}
 */
export function _showPasswordDialog(conference) {
    return openDialog(PasswordRequiredPrompt, { conference });
}
