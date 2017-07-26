/* global $, APP, AJS */

/**
 * Associates tooltip element position (in the terms of
 * {@link UIUtil#setTooltip} which do not look like CSS <tt>position</tt>) with
 * AUI tooltip <tt>gravity</tt>.
 */
const TOOLTIP_POSITIONS = {
    'bottom': 'n',
    'bottom-left': 'ne',
    'bottom-right': 'nw',
    'left': 'e',
    'right': 'w',
    'top': 's',
    'top-left': 'se',
    'top-right': 'sw'
};

/**
 * Sets a global handler for all tooltips. Once invoked, create a new
 * tooltip by merely updating a DOM node with the appropriate class (e.g.
 * <tt>tooltip-n</tt>) and the attribute <tt>content</tt>.
 */
export function activateTooltips() {
    AJS.$('[data-tooltip]').tooltip({
        gravity() {
            return this.getAttribute('data-tooltip');
        },

        title() {
            return this.getAttribute('content');
        },

        html: true, // Handle multiline tooltips.

        // The following two prevent tooltips from being stuck:
        hoverable: false, // Make custom tooltips behave like native ones.
        live: true // Attach listener to document element.
    });
}

/**
 * Sets the tooltip to the given element.
 *
 * @param element the element to set the tooltip to
 * @param key the tooltip data-i18n key
 * @param position the position of the tooltip in relation to the element
 */
export function setTooltip(element, key, position) {
    if (element) {
        const selector = element.jquery ? element : $(element);

        selector.attr('data-tooltip', TOOLTIP_POSITIONS[position]);
        selector.attr('data-i18n', `[content]${key}`);

        APP.translation.translateElement(selector);
    }
}

/**
 * Sets the tooltip to the given element, but instead of using translation
 * key uses text value.
 *
 * @param element the element to set the tooltip to
 * @param text the tooltip text
 * @param position the position of the tooltip in relation to the element
 */
export function setTooltipText(element, text, position) {
    if (element) {
        removeTooltip(element);

        element.setAttribute('data-tooltip', TOOLTIP_POSITIONS[position]);
        element.setAttribute('content', text);
    }
}

/**
 * Removes the tooltip to the given element.
 *
 * @param element the element to remove the tooltip from
 */
export function removeTooltip(element) {
    element.removeAttribute('data-tooltip', '');
    element.removeAttribute('data-i18n','');
    element.removeAttribute('content','');
}
