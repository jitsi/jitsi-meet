// @flow

import React from 'react';
import { Icon } from '../../icons';

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
     * Additional styles.
     */
    styles?: Object,
}

/**
 * Displayes the `ToolboxButtonWithIcon` component.
 *
 * @returns {ReactElement}
 */
export default function ToolboxButtonWithIcon({
    children,
    icon,
    iconDisabled,
    onIconClick,
    styles
}: Props) {
    const iconProps = {};

    if (iconDisabled) {
        iconProps.className = 'settings-button-small-icon settings-button-small-icon--disabled';
    } else {
        iconProps.className = 'settings-button-small-icon';
        iconProps.onClick = onIconClick;
    }

    return (
        <div
            className = 'settings-button-container'
            styles = { styles }>
            { children }
            <Icon
                { ...iconProps }
                size = { 9 }
                src = { icon } />
        </div>
    );
}
