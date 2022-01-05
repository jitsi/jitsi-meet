// @flow

import { type Dispatch } from 'redux';

import { appNavigate } from '../app/actions';
import { openDialog } from '../base/dialog';

import { DisableLobbyModeDialog, EnableLobbyModeDialog } from './components/native';

export * from './actions.any';

/**
 * Cancels the ongoing knocking and abandons the join flow.
 *
 * @returns {Function}
 */
export function cancelKnocking() {
    return async (dispatch: Dispatch<any>) => {
        dispatch(appNavigate(undefined));
    };
}

/**
 * Action to show the dialog to disable lobby mode.
 *
 * @returns {showNotification}
 */
export function showDisableLobbyModeDialog() {
    return openDialog(DisableLobbyModeDialog);
}

/**
 * Action to show the dialog to enable lobby mode.
 *
 * @returns {showNotification}
 */
export function showEnableLobbyModeDialog() {
    return openDialog(EnableLobbyModeDialog);
}
