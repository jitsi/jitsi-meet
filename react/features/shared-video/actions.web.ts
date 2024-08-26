import { IStore } from '../app/types';
import { openDialog } from '../base/dialog/actions';

import { SET_DISABLE_BUTTON } from './actionTypes';
import { setDialogInProgress, setDialogShown } from './actions.any';
import ShareVideoConfirmDialog from './components/web/ShareVideoConfirmDialog';

export * from './actions.any';

/**
 * Disabled share video button.
 *
 * @param {boolean} disabled - The current state of the share video button.
 * @returns {{
 *     type: SET_DISABLE_BUTTON,
 *     disabled: boolean
 * }}
 */
export function setDisableButton(disabled: boolean) {
    return {
        type: SET_DISABLE_BUTTON,
        disabled
    };
}

/**
 * Shows a confirmation dialog whether to play the external video link.
 *
 * @param {string} actor - The actor's name.
 * @param {Function} onSubmit - The function to execute when confirmed.
 *
 * @returns {Function}
 */
export function showConfirmPlayingDialog(actor: String, onSubmit: Function) {
    return (dispatch: IStore['dispatch']) => {
        dispatch(setDialogInProgress(true));
        dispatch(setDialogShown());
        dispatch(openDialog(ShareVideoConfirmDialog, {
            actorName: actor,
            onCancel: () => dispatch(setDialogInProgress(false)),
            onSubmit: () => {
                dispatch(setDialogInProgress(false));
                onSubmit();
            }
        }));
    };
}
