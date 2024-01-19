import {
    appNavigate,
    maybeRedirectToWelcomePage
} from '../app/actions';
import { IStore } from '../app/types';
import { conferenceLeft, setPassword } from '../base/conference/actions';
import { JITSI_CONFERENCE_URL_KEY } from '../base/conference/constants';
import { IJitsiConference } from '../base/conference/reducer';
import { hideDialog, openDialog } from '../base/dialog/actions';
import { SecurityDialog } from '../security/components/security-dialog';

import PasswordRequiredPrompt from './components/PasswordRequiredPrompt';

/**
 * Cancels a prompt for a password to join a specific conference/room.
 *
 * @param {JitsiConference} conference - The {@code JitsiConference} requesting
 * the password to join.
 * @protected
 * @returns {Function}
 */
export function _cancelPasswordRequiredPrompt(conference: any) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {

        if (typeof APP !== 'undefined') {
            // when we are redirecting the library should handle any
            // unload and clean of the connection.
            APP.API.notifyReadyToClose();

            dispatch(maybeRedirectToWelcomePage());

            return;
        }

        // Canceling PasswordRequiredPrompt is to navigate the app/user to
        // WelcomePage. In other words, the canceling invalidates the
        // locationURL. Make sure that the canceling indeed has the intent to
        // invalidate the locationURL.
        const state = getState();

        if (conference === state['features/base/conference'].passwordRequired
                && conference[JITSI_CONFERENCE_URL_KEY]
                    === state['features/base/connection'].locationURL) {
            // XXX The error associated with CONFERENCE_FAILED was marked as
            // recoverable by the feature room-lock and, consequently,
            // recoverable-aware features such as mobile's external-api did not
            // deliver the CONFERENCE_FAILED to the SDK clients/consumers. Since
            // the app/user is going to nativate to WelcomePage, the SDK
            // clients/consumers need an event.
            dispatch(conferenceLeft(conference));

            dispatch(appNavigate(undefined));
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
export function endRoomLockRequest(
        conference: IJitsiConference,
        password?: string) {
    return (dispatch: IStore['dispatch']) => {
        const setPassword_
            = password
                ? dispatch(setPassword(conference, conference.lock, password))
                : Promise.resolve();
        const endRoomLockRequest_ = () => dispatch(hideDialog(SecurityDialog));

        setPassword_.then(endRoomLockRequest_, endRoomLockRequest_);
    };
}

/**
 * Begins a prompt for a password to join a specific conference/room.
 *
 * @param {JitsiConference} conference - The {@code JitsiConference}
 * requesting the password to join.
 * @protected
 * @returns {{
 *     type: OPEN_DIALOG,
 *     component: Component,
 *     props: PropTypes
 * }}
 */
export function _openPasswordRequiredPrompt(conference: IJitsiConference) {
    return openDialog(PasswordRequiredPrompt, { conference });
}

/**
 * Unlocks the current jitsi conference.
 *
 * @returns {Function}
 */
export function unlockRoom() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { conference } = getState()['features/base/conference'];

        return dispatch(setPassword(
            conference,
            conference?.lock,
            ''
        ));
    };
}


