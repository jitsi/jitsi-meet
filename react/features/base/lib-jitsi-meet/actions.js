/* @flow */

import { jitsiLocalStorage } from '@jitsi/js-utils';
import type { Dispatch } from 'redux';

import { isOnline } from '../net-info/selectors';

import JitsiMeetJS from './_';
import {
    LIB_DID_DISPOSE,
    LIB_DID_INIT,
    LIB_INIT_ERROR,
    LIB_WILL_DISPOSE,
    LIB_WILL_INIT
} from './actionTypes';
import { isAnalyticsEnabled } from './functions';

declare var APP: Object;

/**
 * Disposes (of) lib-jitsi-meet.
 *
 * @returns {Function}
 */
export function disposeLib() {
    return (dispatch: Dispatch<any>) => {
        dispatch({ type: LIB_WILL_DISPOSE });

        // TODO Currently, lib-jitsi-meet doesn't have the functionality to
        // dispose itself.
        dispatch({ type: LIB_DID_DISPOSE });
    };
}

/**
 * Initializes lib-jitsi-meet (i.e. {@link invokes JitsiMeetJS.init()}) with the
 * current config(uration).
 *
 * @returns {Function}
 */
export function initLib() {
    return (dispatch: Dispatch<any>, getState: Function): void => {
        const state = getState();
        const config = state['features/base/config'];

        if (!config) {
            throw new Error('Cannot init lib-jitsi-meet without config');
        }

        dispatch({ type: LIB_WILL_INIT });

        try {
            JitsiMeetJS.init({
                enableAnalyticsLogging: isAnalyticsEnabled(getState),
                ...config,
                externalStorage: jitsiLocalStorage.isLocalStorageDisabled() ? jitsiLocalStorage : undefined
            });
            JitsiMeetJS.setNetworkInfo({
                isOnline: isOnline(state)
            });
            dispatch({ type: LIB_DID_INIT });
        } catch (error) {
            dispatch(libInitError(error));
        }
    };
}

/**
 * Notifies about a specific error raised by {@link JitsiMeetJS.init()}.
 *
 * @param {Error} error - The Error raised by JitsiMeetJS.init().
 * @returns {{
 *     type: LIB_INIT_ERROR,
 *     error: Error
 * }}
 */
export function libInitError(error: Error) {
    return {
        type: LIB_INIT_ERROR,
        error
    };
}
