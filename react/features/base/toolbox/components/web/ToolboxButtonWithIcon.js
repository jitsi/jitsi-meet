// @flow

import React from 'react';

import { Icon } from '../../../icons';
import { Tooltip } from '../../../tooltip';

type Props = {

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
        iconProps.onClick = onIconClick;
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
