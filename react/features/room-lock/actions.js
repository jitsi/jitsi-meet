// @flow

import type { Dispatch } from 'redux';

import {
    appNavigate,
    maybeRedirectToWelcomePage
} from '../app/actions';
import {
    conferenceLeft,
    JITSI_CONFERENCE_URL_KEY,
    setPassword
} from '../base/conference';
import { hideDialog, openDialog } from '../base/dialog';

import { PasswordRequiredPrompt, RoomLockPrompt } from './components';

declare var APP: Object;

/**
 * Begins a (user) request to lock a specific conference/room.
 *
 * @param {JitsiConference|undefined} conference - The JitsiConference to lock
 * if specified or undefined if the current JitsiConference is to be locked.
 * @returns {Function}
 */
export function beginRoomLockRequest(conference: ?Object) {
    return (dispatch: Function, getState: Function) => {
        if (typeof conference === 'undefined') {
            // eslint-disable-next-line no-param-reassign
            conference = getState()['features/base/conference'].conference;
        }
        if (conference) {
            const passwordNumberOfDigits = getState()['features/base/config'].roomPasswordNumberOfDigits;

            dispatch(openDialog(RoomLockPrompt, {
                conference,
                passwordNumberOfDigits }));
        }
    };
}

/**
 * Cancels a prompt for a password to join a specific conference/room.
 *
 * @param {JitsiConference} conference - The {@code JitsiConference} requesting
 * the password to join.
 * @protected
 * @returns {Function}
 */
export function _cancelPasswordRequiredPrompt(conference: Object) {
    return (dispatch: Dispatch<any>, getState: Function) => {

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
        conference: { lock: Function },
        password: ?string) {
    return (dispatch: Function) => {
        const setPassword_
            = password
                ? dispatch(setPassword(conference, conference.lock, password))
                : Promise.resolve();
        const endRoomLockRequest_ = () => dispatch(hideDialog(RoomLockPrompt));

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
export function _openPasswordRequiredPrompt(conference: Object) {
    return openDialog(PasswordRequiredPrompt, { conference });
}

/**
 * Unlocks the current jitsi conference.
 *
 * @returns {Function}
 */
export function unlockRoom() {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const { conference } = getState()['features/base/conference'];

        return dispatch(setPassword(
            conference,
            conference.lock,
            ''
        ));
    };
}
