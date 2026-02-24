import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    CUSTOM_PANEL_CLOSE,
    CUSTOM_PANEL_OPEN,
    SET_CUSTOM_PANEL_ENABLED
} from './actionTypes';

/**
 * The state of the custom panel feature.
 */
export interface ICustomPanelState {

    /**
     * Whether the custom panel feature is enabled.
     * This can be toggled dynamically via console.
     */
    enabled: boolean;

    /**
     * Whether the custom panel is currently open.
     */
    isOpen: boolean;
}

const DEFAULT_STATE: ICustomPanelState = {
    enabled: false,
    isOpen: false
};

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

        default:
            return state;
        }
    }
);
