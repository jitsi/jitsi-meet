import { IReduxState } from '../app/types';
import { isIosMobileBrowser } from '../base/environment/utils';
import { showOverflowDrawer } from '../toolbox/functions.web';

/**
 * Whether a voice agent's context menu has anything in it. Its only item is the volume slider, offered where a
 * participant's is: on the thumbnail and in the overflow drawer, not in the desktop participants pane, and never with
 * startSilent or on iOS, which has no volume control.
 *
 * @param {IReduxState} state - The redux state.
 * @param {boolean} thumbnailMenu - Whether the menu opens from the thumbnail.
 * @returns {boolean}
 */
export function hasVoiceAgentMenuItems(state: IReduxState, thumbnailMenu: boolean): boolean {
    return !state['features/base/config'].startSilent
        && !isIosMobileBrowser()
        && (showOverflowDrawer(state) || thumbnailMenu);
}
