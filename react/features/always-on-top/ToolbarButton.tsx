import React, { useCallback } from 'react';

import Icon from '../base/icons/components/Icon';

interface IProps {

    /**
     * Accessibility label for button.
     */
    accessibilityLabel: string;

    /**
     * An extra class name to be added at the end of the element's class name
     * in order to enable custom styling.
     */
    customClass?: string;

    /**
     * Whether or not the button is disabled.
     */
    disabled?: boolean;

    /**
     * Button icon.
     */
    icon: Function;

    /**
     * Click handler.
     */
    onClick: (e?: React.MouseEvent) => void;

    /**
     * Whether or not the button is toggled.
     */
    toggled?: boolean;
}

const ToolbarButton = ({
    accessibilityLabel,
    customClass,
    disabled = false,
    onClick,
    icon,
    toggled = false
}: IProps) => {
    const onKeyPress = useCallback(event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
        }
    }, [ onClick ]);

    return (<div
        aria-disabled = { disabled }
        aria-label = { accessibilityLabel }
        aria-pressed = { toggled }
        className = { `toolbox-button ${disabled ? ' disabled' : ''}` }
        onClick = { disabled ? undefined : onClick }
        onKeyPress = { disabled ? undefined : onKeyPress }
        role = 'button'
        tabIndex = { 0 }>
        <div className = { `toolbox-icon ${disabled ? 'disabled' : ''} ${customClass ?? ''}` }>
            <Icon src = { icon } />
        </div>
    </div>);
};

export default ToolbarButton;
