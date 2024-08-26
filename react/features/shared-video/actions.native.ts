import i18n from 'i18next';

import { IStore } from '../app/types';
import { openDialog } from '../base/dialog/actions';
import ConfirmDialog from '../base/dialog/components/native/ConfirmDialog';

export * from './actions.any';

/**
 * Shows a confirmation dialog whether to play the external video link.
 *
 * @param {string} actor - The actor's name.
 * @param {Function} onSubmit - The function to execute when confirmed.
 *
 * @returns {Function}
 */
export function showConfirmPlayingDialog(actor: String, onSubmit: Function): Function {
    return (dispatch: IStore['dispatch']) => {
        dispatch(openDialog(ConfirmDialog, {
            cancelLabel: 'dialog.Cancel',
            confirmLabel: 'dialog.Ok',
            descriptionKey: 'dialog.shareVideoConfirmPlay',
            onSubmit,
            title: i18n.t('dialog.shareVideoConfirmPlayTitle', {
                name: actor
            })
        }));
    };
}
