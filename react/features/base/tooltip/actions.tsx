import { ReactElement } from 'react';

import { HIDE_TOOLTIP, SHOW_TOOLTIP } from './actionTypes';

/**
 * Set tooltip state to visible.
 *
 * @param {string} content - The content of the tooltip.
 * Used as unique identifier for tooltip.
 * @returns {Object}
 */
export function showTooltip(content: string | ReactElement) {
    return {
        type: SHOW_TOOLTIP,
        content
    };
}

/**
 * Set tooltip state to hidden.
 *
 * @param {string} content - The content of the tooltip.
 * Used as unique identifier for tooltip.
 * @returns {Object}
 */
export function hideTooltip(content: string | ReactElement) {
    return {
        type: HIDE_TOOLTIP,
        content
    };
}
