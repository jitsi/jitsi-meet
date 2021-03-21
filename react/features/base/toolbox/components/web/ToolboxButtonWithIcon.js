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
        styles
    } = props;

    const iconProps = {};

    if (iconDisabled) {
        iconProps.className
            = 'settings-button-small-icon settings-button-small-icon--disabled';
    } else {
        iconProps.className = 'settings-button-small-icon';
        iconProps.onClick = onIconClick;
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
                        size = { 9 }
                        src = { icon } />
                </Tooltip>
            </div>
        </div>
    );
}
