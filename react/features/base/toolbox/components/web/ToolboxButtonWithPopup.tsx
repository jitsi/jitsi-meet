import React from 'react';

import Icon from '../../../icons/components/Icon';
import Popover from '../../../popover/components/Popover.web';

interface IProps {

    /**
     * Aria label for the Icon.
     */
    ariaLabel?: string;

    /**
     * The decorated component (ToolboxButton).
     */
    children: React.ReactNode;

    /**
     * Icon of the button.
     */
    icon?: Function;

    /**
     * Flag used for disabling the small icon.
     */
    iconDisabled?: boolean;

    /**
     * Popover close callback.
     */
    onPopoverClose: Function;

    /**
     * Popover open callback.
     */
    onPopoverOpen: Function;

    /**
     * The content that will be displayed inside the popover.
     */
    popoverContent: React.ReactNode;

    /**
     * Additional styles.
     */
    styles?: Object;

    /**
     * Whether the trigger for open/ close should be click or hover.
     */
    trigger?: 'hover' | 'click';

    /**
     * Whether or not the popover is visible.
     */
    visible: boolean;
}

/**
 * Displays the `ToolboxButtonWithIcon` component.
 *
 * @param {Object} props - Component's props.
 * @returns {ReactElement}
 */
export default function ToolboxButtonWithPopup(props: IProps) {
    const {
        ariaLabel,
        children,
        icon,
        iconDisabled,
        onPopoverClose,
        onPopoverOpen,
        popoverContent,
        styles,
        trigger,
        visible
    } = props;

    if (!icon) {
        return (
            <div
                className = 'settings-button-container'
                style = { styles }>
                <Popover
                    content = { popoverContent }
                    headingLabel = { ariaLabel }
                    onPopoverClose = { onPopoverClose }
                    onPopoverOpen = { onPopoverOpen }
                    position = 'top'
                    trigger = { trigger }
                    visible = { visible }>
                    {children}
                </Popover>
            </div>
        );
    }

    return (
        <div
            className = 'settings-button-container'
            style = { styles }>
            {children}
            <div className = 'settings-button-small-icon-container'>
                <Popover
                    content = { popoverContent }
                    headingLabel = { ariaLabel }
                    onPopoverClose = { onPopoverClose }
                    onPopoverOpen = { onPopoverOpen }
                    position = 'top'
                    visible = { visible }>
                    <Icon
                        alt = { ariaLabel }
                        className = { `settings-button-small-icon ${iconDisabled
                            ? 'settings-button-small-icon--disabled'
                            : ''}` }
                        size = { 16 }
                        src = { icon } />
                </Popover>
            </div>
        </div>
    );
}
