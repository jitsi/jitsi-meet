import { setPassword } from '../base/conference';
import { hideDialog, openDialog } from '../base/dialog';
import { PasswordRequiredPrompt, RoomLockPrompt } from './components';

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
            dispatch(openDialog(RoomLockPrompt, { conference }));
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
            dispatch(hideDialog());
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
 *     type: OPEN_DIALOG,
 *     component: Component,
 *     props: PropTypes
 * }}
 */
export function _showPasswordDialog(conference) {
    return openDialog(PasswordRequiredPrompt, { conference });
}
