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
     * Icon to display in the options section.
     */
    OptionsIcon?: React$Node,

    /**
     * TestId of the button. Can be used to locate element when testing UI.
     */
    testId?: string,

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
    OptionsIcon = IconArrowDown,
    testId,
    type = 'primary',
    onClick,
    onOptionsClick
}: Props) {
    return (
        <div
            className = { `action-btn ${className} ${type} ${disabled ? 'disabled' : ''}` }
            data-testid = { testId ? testId : undefined }
            onClick = { disabled ? undefined : onClick }>
            {children}
            {hasOptions && <div
                className = 'options'
                data-testid = 'prejoin.joinOptions'
                onClick = { disabled ? undefined : onOptionsClick }>
                <Icon
                    className = 'icon'
                    size = { 14 }
                    src = { OptionsIcon } />
            </div>
            }
        </div>
    );
}

export default ActionButton;
