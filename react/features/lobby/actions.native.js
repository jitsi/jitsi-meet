// @flow

import { openDialog } from '../base/dialog';

import { DisableLobbyModeDialog, EnableLobbyModeDialog } from './components/native';

export * from './actions.web';
export * from './actions.any';

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
