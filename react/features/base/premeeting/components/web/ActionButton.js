// @flow

import React from 'react';

import { Icon, IconArrowDown } from '../../../icons';

type Props = {

    /**
     * Text of the button.
     */
    children: React$Node,

    /**
     * Text css class of the button.
     */
    className?: string,

    /**
     * If the button is disabled or not.
     */
    disabled?: boolean,

    /**
     * If the button has options.
     */
    hasOptions?: boolean,

    /**
     * The type of th button: primary, secondary, text.
     */
    type: string,

    /**
     * OnClick button handler.
     */
    onClick: Function,

    /**
     * Click handler for options.
     */
    onOptionsClick?: Function
};

/**
 * Button used for pre meeting actions.
 *
 * @returns {ReactElement}
 */
function ActionButton({
    children,
    className = '',
    disabled,
    hasOptions,
    type = 'primary',
    onClick,
    onOptionsClick
}: Props) {
    return (
        <div
            className = { `action-btn ${className} ${type} ${disabled ? 'disabled' : ''}` }
            onClick = { disabled ? undefined : onClick }>
            {children}
            {hasOptions && <div
                className = 'options'
                onClick = { disabled ? undefined : onOptionsClick }>
                <Icon
                    className = 'icon'
                    size = { 14 }
                    src = { IconArrowDown } />
            </div>
            }
        </div>
    );
}

export default ActionButton;
