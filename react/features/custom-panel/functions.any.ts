import { IReduxState } from '../app/types';

import { DEFAULT_CUSTOM_PANEL_WIDTH } from './constants';

/**
 * Returns the width the custom panel takes from the video space. 0 when closed, disabled,
 * or on native, where the panel is a navigation route and its slice is never registered.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {number}
 */
export function getCustomPanelWidth(state: IReduxState): number {
    const panel = state['features/custom-panel'];

    if (!panel?.enabled || !panel.isOpen) {
        return 0;
    }

    return panel.width?.current ?? DEFAULT_CUSTOM_PANEL_WIDTH;
}
