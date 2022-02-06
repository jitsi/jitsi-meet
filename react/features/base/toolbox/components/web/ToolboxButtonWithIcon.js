// @flow

import React from 'react';

import { NOTIFY_CLICK_MODE } from '../../../../toolbox/constants';
import { Icon } from '../../../icons';
import { Tooltip } from '../../../tooltip';

type Props = {

    /**
     * The button's key.
     */
    buttonKey?: string,

    /**
     * The decorated component (ToolboxButton).
     */
    children: React$Node,

    /**
     * Icon of the button.
     */
    icon: Function,

    /**
     * Flag used for disabling the small icon.
     */
    iconDisabled: boolean,

    /**
     * Notify mode for `toolbarButtonClicked` event -
     * whether to only notify or to also prevent button click routine.
     */
    notifyMode?: string,

    /**
     * Click handler for the small icon.
     */
    onIconClick: Function,

    /**
     * The tooltip used for the icon.
     */
    iconTooltip: string,

    /**
     * Additional styles.
     */
    styles?: Object,

    /**
     * Aria label for the Icon.
     */
    ariaLabel?: string,

    /**
     * Whether the element has a popup.
     */
    ariaHasPopup?: boolean,

    /**
     * Whether the element popup is expanded.
     */
    ariaExpanded?: boolean,

    /**
     * The id of the element this button icon controls.
     */
    ariaControls?: string,

    /**
     * Keydown handler for icon.
     */
    onIconKeyDown?: Function,

    /**
     * The ID of the icon button.
     */
    iconId: string
};

declare var APP: Object;

/**
 * Displays the `ToolboxButtonWithIcon` component.
 *
 * @param {Object} props - Component's props.
 * @returns {ReactElement}
 */
export default function ToolboxButtonWithIcon(props: Props) {
    const {
        children,
        icon,
        iconDisabled,
        iconTooltip,
        buttonKey,
        notifyMode,
        onIconClick,
        onIconKeyDown,
        styles,
        ariaLabel,
        ariaHasPopup,
        ariaControls,
        ariaExpanded,
        iconId
    } = props;

    const iconProps = {};

    if (iconDisabled) {
        iconProps.className
            = 'settings-button-small-icon settings-button-small-icon--disabled';
    } else {
        iconProps.className = 'settings-button-small-icon';
        iconProps.onClick = () => {
            if (typeof APP !== 'undefined' && notifyMode) {
                APP.API.notifyToolbarButtonClicked(
                    buttonKey, notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY
                );
            }

            if (notifyMode !== NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
                onIconClick();
            }
        };
        iconProps.onKeyDown = onIconKeyDown;
        iconProps.role = 'button';
        iconProps.tabIndex = 0;
        iconProps.ariaControls = ariaControls;
        iconProps.ariaExpanded = ariaExpanded;
        iconProps.containerId = iconId;
    }


    return (
        <div
            className = 'settings-button-container'
            styles = { styles }>
            {children}

            <div>
                <Tooltip
                    content = { iconTooltip }
                    position = 'top'>
                    <Icon
                        { ...iconProps }
                        ariaHasPopup = { ariaHasPopup }
                        ariaLabel = { ariaLabel }
                        size = { 9 }
                        src = { icon } />
                </Tooltip>
            </div>
        </div>
    );
}
