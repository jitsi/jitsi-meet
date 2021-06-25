// @flow

import React, { useCallback } from 'react';

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
    onOptionsClick?: Function,

    /**
     * to navigate with the keyboard.
     */
    tabIndex?: number,

    /**
     * to give a role to the icon.
     */
    role?: string,

    /**
     * to give a aria-pressed to the icon.
     */
    ariaPressed?: boolean,

    /**
     * The Label of the current element
     */
    ariaLabel?: string,

    /**
     * The Label of the child element
     */
    ariaDropDownLabel?: string
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
    onOptionsClick,
    tabIndex,
    role,
    ariaPressed,
    ariaLabel,
    ariaDropDownLabel
}: Props) {

    const onKeyPressHandler = useCallback(e => {
        if (onClick && !disabled && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            onClick(e);
        }
    }, [ onClick, disabled ]);

    const onOptionsKeyPressHandler = useCallback(e => {
        if (onOptionsClick && !disabled && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            e.stopPropagation();
            onOptionsClick(e);
        }
    }, [ onOptionsClick, disabled ]);

    return (
        <div
            aria-disabled = { disabled }
            aria-label = { ariaLabel }
            className = { `action-btn ${className} ${type} ${disabled ? 'disabled' : ''}` }
            data-testid = { testId ? testId : undefined }
            onClick = { disabled ? undefined : onClick }
            onKeyPress = { onKeyPressHandler }
            role = 'button'
            tabIndex = { 0 } >
            {children}
            { hasOptions
                  && <div
                      aria-disabled = { disabled }
                      aria-haspopup = 'true'
                      aria-label = { ariaDropDownLabel }
                      aria-pressed = { ariaPressed }
                      className = 'options'
                      data-testid = 'prejoin.joinOptions'
                      onClick = { disabled ? undefined : onOptionsClick }
                      onKeyPress = { onOptionsKeyPressHandler }
                      role = { role }
                      tabIndex = { tabIndex }>
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
