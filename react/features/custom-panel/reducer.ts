import PersistenceRegistry from '../base/redux/PersistenceRegistry';
import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    CUSTOM_PANEL_CLOSE,
    CUSTOM_PANEL_OPEN,
    SET_CUSTOM_PANEL_ENABLED,
    SET_CUSTOM_PANEL_IS_RESIZING,
    SET_CUSTOM_PANEL_WIDTH,
    SET_USER_CUSTOM_PANEL_WIDTH
} from './actionTypes';
import { DEFAULT_CUSTOM_PANEL_WIDTH } from './constants';

/**
 * The state of the custom panel feature.
 */
export interface ICustomPanelState {

    /**
     * Whether the custom panel button has been revealed, through the console helper
     * or the Ctrl+Alt+E shortcut. This gates the button on top of
     * `config.customPanel.enabled`; on its own it does not enable the feature.
     */
    enabled: boolean;

    /**
     * Whether the custom panel is currently open.
     */
    isOpen: boolean;

    /**
     * Whether the user is currently resizing the custom panel.
     */
    isResizing: boolean;

    /**
     * The width state of the custom panel.
     */
    width: {

        /**
         * The current display width in pixels.
         */
        current: number;

        /**
         * The user-preferred width set via drag resize, or null if not set.
         */
        userSet: number | null;
    };
}

const DEFAULT_STATE: ICustomPanelState = {
    enabled: false,
    isOpen: false,
    isResizing: false,
    width: {
        current: DEFAULT_CUSTOM_PANEL_WIDTH,
        userSet: null
    }
};

/**
 * Persist the revealed flag and the width subtree, so that both the user's preferred
 * panel width and the revealed state survive page reloads.
 */
PersistenceRegistry.register('features/custom-panel', {
    enabled: true,
    width: true
});

/**
 * Listen for actions that mutate the custom panel state.
 */
ReducerRegistry.register(
    'features/custom-panel', (state: ICustomPanelState = DEFAULT_STATE, action): ICustomPanelState => {
        switch (action.type) {
        case CUSTOM_PANEL_CLOSE:
            return {
                ...state,
                isOpen: false
            };

        case CUSTOM_PANEL_OPEN:
            return {
                ...state,
                isOpen: true
            };

        case SET_CUSTOM_PANEL_ENABLED:
            return {
                ...state,
                enabled: action.enabled
            };

        case SET_CUSTOM_PANEL_WIDTH:
            return {
                ...state,
                width: {
                    ...state.width,
                    current: action.width
                }
            };

        case SET_USER_CUSTOM_PANEL_WIDTH:
            return {
                ...state,
                width: {
                    current: action.width,
                    userSet: action.width
                }
            };

        case SET_CUSTOM_PANEL_IS_RESIZING:
            return {
                ...state,
                isResizing: action.resizing
            };

        default:
            return state;
        }
    }
);
