import {
    CUSTOM_PANEL_CLOSE,
    CUSTOM_PANEL_OPEN,
    SET_CUSTOM_PANEL_ENABLED,
    SET_CUSTOM_PANEL_IS_RESIZING,
    SET_CUSTOM_PANEL_WIDTH,
    SET_USER_CUSTOM_PANEL_WIDTH
} from './actionTypes';

/**
 * Action to close the custom panel.
 *
 * @returns {Object} The action object.
 * NOTE: this action is used in the branding files.
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

/**
 * Sets the custom panel width (used for responsive adjustments).
 *
 * @param {number} width - The new width of the custom panel.
 * @returns {Object} The action object.
 */
export function setCustomPanelWidth(width: number) {
    return {
        type: SET_CUSTOM_PANEL_WIDTH,
        width
    };
}

/**
 * Sets the user-preferred custom panel width (triggered by user drag).
 *
 * @param {number} width - The new width of the custom panel.
 * @returns {Object} The action object.
 */
export function setUserCustomPanelWidth(width: number) {
    return {
        type: SET_USER_CUSTOM_PANEL_WIDTH,
        width
    };
}

/**
 * Sets whether the user is currently resizing the custom panel.
 *
 * @param {boolean} resizing - Whether the panel is being resized.
 * @returns {Object} The action object.
 */
export function setCustomPanelIsResizing(resizing: boolean) {
    return {
        type: SET_CUSTOM_PANEL_IS_RESIZING,
        resizing
    };
}
