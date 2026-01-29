import {
    CUSTOM_PANEL_CLOSE,
    CUSTOM_PANEL_OPEN,
    SET_CUSTOM_PANEL_ENABLED
} from './actionTypes';

/**
 * Action to close the custom panel.
 *
 * @returns {Object} The action object.
 */
export function close() {
    return {
        type: CUSTOM_PANEL_CLOSE
    };
}

/**
 * Action to open the custom panel.
 *
 * @returns {Object} The action object.
 */
export function open() {
    return {
        type: CUSTOM_PANEL_OPEN
    };
}

/**
 * Action to enable or disable the custom panel dynamically.
 *
 * @param {boolean} enabled - Whether the custom panel should be enabled.
 * @returns {Object} The action object.
 */
export function setCustomPanelEnabled(enabled: boolean) {
    return {
        type: SET_CUSTOM_PANEL_ENABLED,
        enabled
    };
}
