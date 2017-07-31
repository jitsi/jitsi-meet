import SideContainerToggler
    from '../../../modules/UI/side_pannels/SideContainerToggler';

import defaultToolbarButtons from './defaultToolbarButtons';

declare var $: Function;
declare var AJS: Object;
declare var interfaceConfig: Object;

export { abstractMapStateToProps } from './functions.native';

/**
 * Returns an object which contains the default buttons for the primary and
 * secondary toolbars.
 *
 * @param {Object} buttonHandlers - Contains additional toolbox button
 * handlers.
 * @returns {Object}
 */
export function getDefaultToolboxButtons(buttonHandlers: Object): Object {
    let toolbarButtons = {
        primaryToolbarButtons: new Map(),
        secondaryToolbarButtons: new Map()
    };

    if (typeof interfaceConfig !== 'undefined'
            && interfaceConfig.TOOLBAR_BUTTONS) {

        toolbarButtons
            = interfaceConfig.TOOLBAR_BUTTONS.reduce(
                (acc, buttonName) => {
                    let button = defaultToolbarButtons[buttonName];
                    const currentButtonHandlers = buttonHandlers[buttonName];

                    if (button) {
                        const place = _getToolbarButtonPlace(buttonName);

                        button.buttonName = buttonName;

                        if (currentButtonHandlers) {
                            button = {
                                ...button,
                                ...currentButtonHandlers
                            };
                        }

                        // If isDisplayed method is not defined, display the
                        // button only for non-filmstripOnly mode
                        if (button.isDisplayed()) {
                            acc[place].set(buttonName, button);
                        }
                    }

                    return acc;
                },
                toolbarButtons);
    }

    return toolbarButtons;
}

/**
 * Returns toolbar class names to add while rendering.
 *
 * @param {Object} props - Props object pass to React component.
 * @returns {Object}
 * @private
 */
export function getToolbarClassNames(props: Object) {
    const primaryToolbarClassNames = [
        interfaceConfig.filmStripOnly
            ? 'toolbar_filmstrip-only'
            : 'toolbar_primary'
    ];
    const secondaryToolbarClassNames = [ 'toolbar_secondary' ];

    if (props._visible) {
        const slideInAnimation
            = SideContainerToggler.isVisible ? 'slideInExtX' : 'slideInX';

        primaryToolbarClassNames.push('fadeIn');
        secondaryToolbarClassNames.push(slideInAnimation);
    } else {
        const slideOutAnimation
            = SideContainerToggler.isVisible ? 'slideOutExtX' : 'slideOutX';

        primaryToolbarClassNames.push('fadeOut');
        secondaryToolbarClassNames.push(slideOutAnimation);
    }

    return {
        primaryToolbarClassName: primaryToolbarClassNames.join(' '),
        secondaryToolbarClassName: secondaryToolbarClassNames.join(' ')
    };
}

/**
 * Indicates if a toolbar button is enabled.
 *
 * @param {string} name - The name of the setting section as defined in
 * interface_config.js.
 * @returns {boolean} - True to indicate that the given toolbar button
 * is enabled, false - otherwise.
 */
export function isButtonEnabled(name) {
    return interfaceConfig.TOOLBAR_BUTTONS.indexOf(name) !== -1
            || interfaceConfig.MAIN_TOOLBAR_BUTTONS.indexOf(name) !== -1;
}

/**
 * Show custom popup/tooltip for a specified button.
 *
 * @param {string} popupSelectorID - The selector id of the popup to show.
 * @param {boolean} show - True or false/show or hide the popup.
 * @param {number} timeout - The time to show the popup.
 * @returns {void}
 */
export function showCustomToolbarPopup(
        popupSelectorID: string,
        show: boolean,
        timeout: number) {
    AJS.$(popupSelectorID).tooltip({
        gravity: $(popupSelectorID).attr('data-popup'),
        html: true,
        title: 'title',
        trigger: 'manual'
    });

    if (show) {
        AJS.$(popupSelectorID).tooltip('show');

        setTimeout(
            () => {
                // hide the tooltip
                AJS.$(popupSelectorID).tooltip('hide');
            },
            timeout);
    } else {
        AJS.$(popupSelectorID).tooltip('hide');
    }
}

/**
 * Get place for toolbar button. Now it can be in the primary Toolbar or in the
 * secondary Toolbar.
 *
 * @param {string} btn - Button name.
 * @private
 * @returns {string}
 */
function _getToolbarButtonPlace(btn) {
    return (
        interfaceConfig.MAIN_TOOLBAR_BUTTONS.includes(btn)
            ? 'primaryToolbarButtons'
            : 'secondaryToolbarButtons');
}
