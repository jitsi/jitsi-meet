// @flow

import { type Dispatch } from 'redux';

import {
    getCurrentConference
} from '../base/conference';

import { SET_LOBBY_VISIBILITY } from './actionTypes';

/**
 * Action to toggle lobby mode on or off.
 *
 * @param {boolean} enabled - The desired (new) state of the lobby mode.
 * @returns {Function}
 */
export function toggleLobbyMode(enabled: boolean) {
    return async (dispatch: Dispatch<any>, getState: Function) => {
        const conference = getCurrentConference(getState);

        if (enabled) {
            conference.enableLobby();
        } else {
            conference.disableLobby();
        }
    };
}

/**
 * Action to open the lobby screen.
 *
 * @returns {openDialog}
 */
export function openLobbyScreen() {
    return {
        type: SET_LOBBY_VISIBILITY,
        visible: true
    };
}

/**
 * Action to hide the lobby screen.
 *
 * @returns {hideDialog}
 */
export function hideLobbyScreen() {
    return {
        type: SET_LOBBY_VISIBILITY,
        visible: false
    };
}
