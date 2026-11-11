import { IStore } from '../app/types';
import { openDialog } from '../base/dialog/actions';

import PermissionPromptDialog from './components/web/PermissionPromptDialog';
import { CaptureKind, getKindsToPrompt } from './functions';

// A new key for every dialog, so that one opened while the previous one fades out isn't reused with its state.
let dialogKey = 0;

/**
 * Explains why the devices are needed before the browser asks for access to them.
 *
 * @param {CaptureKind[]} kinds - The devices about to be requested.
 * @param {boolean} [whenUnmuting] - Whether the user is unmuting one device, in which case the dialog also offers
 * access to the other one.
 * @returns {Function} - Resolves with the devices to request: all of them, or when the user declines, the ones the
 * browser doesn't prompt for.
 */
export function explainBeforePrompt(kinds: CaptureKind[], whenUnmuting = false) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']): Promise<CaptureKind[]> => {
        const state = getState();
        const toPrompt = getKindsToPrompt(state, kinds);

        // The reduced UI shows no dialogs.
        if (!toPrompt.length || state['features/base/config'].disablePermissionPromptDialog
                || state['features/base/responsive-ui'].reducedUI) {
            return Promise.resolve(kinds);
        }

        const otherKind = toPrompt[0] === 'audio' ? 'video' : 'audio';
        const offerOtherKind = whenUnmuting && toPrompt.length === 1 && getKindsToPrompt(state, [ otherKind ]).length;

        return new Promise<boolean>(resolve => {
            dispatch(openDialog('PermissionPromptDialog', PermissionPromptDialog, {
                key: ++dialogKey,
                kinds: toPrompt,
                onDone: resolve,
                otherKind: offerOtherKind ? otherKind : undefined,
                whenUnmuting
            }));
        }).then(allowed => allowed ? kinds : kinds.filter(kind => !toPrompt.includes(kind)));
    };
}
