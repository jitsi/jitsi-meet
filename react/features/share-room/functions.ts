import { IReduxState } from '../app/types';
import BaseTheme from '../base/ui/components/BaseTheme.native';

/**
 * Control for invite others button enabling.
 *
 * @param {IReduxState} state - State object.
 * @returns {Object}
 */
export function getInviteOthersControl(state: IReduxState) {
    const { shareDialogVisible } = state['features/share-room'];
    const { icon01, icon03 } = BaseTheme.palette;

    return {
        color: shareDialogVisible ? icon03 : icon01,
        shareDialogVisible
    };
}
