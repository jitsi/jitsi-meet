// @flow

import { withStyles } from '@material-ui/styles';
import clsx from 'clsx';
import React, { useCallback } from 'react';

import { Icon, IconArrowDown } from '../../../icons';
import { withPixelLineHeight } from '../../../styles/functions.web';

type Props = {

    /**
     * Text of the button.
     */
    children: React$Node,

    /**
     * An object containing the CSS classes.
     */
    classes: Object,

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
     * To navigate with the keyboard.
     */
    tabIndex?: number,

    /**
     * To give a role to the icon.
     */
    role?: string,

    /**
     * To give a aria-pressed to the icon.
     */
    ariaPressed?: boolean,

    /**
     * The Label of the current element.
     */
    ariaLabel?: string,

    /**
     * The Label of the child element.
     */
    ariaDropDownLabel?: string
};

/**
 * Creates the styles for the component.
 *
 * @param {Object} theme - The current UI theme.
 *
 * @returns {Object}
 */
const styles = theme => {
    return {
        actionButton: {
            ...withPixelLineHeight(theme.typography.bodyLongBold),
            borderRadius: theme.shape.borderRadius,
            boxSizing: 'border-box',
            color: theme.palette.text01,
            cursor: 'pointer',
            display: 'inline-block',
            marginBottom: '16px',
            padding: '7px 16px',
            position: 'relative',
            textAlign: 'center',
            width: '100%',

            '&.primary': {
                background: theme.palette.action01,
                border: '1px solid #0376DA',

                '&:hover': {
                    backgroundColor: theme.palette.action01Hover
                }
            },

            '&.secondary': {
                background: theme.palette.action02,
                border: '1px solid transparent'
            },

            '&.text': {
                width: 'auto',
                fontSize: '13px',
                margin: '0',
                padding: '0'
            },

            '&.disabled': {
                background: theme.palette.action01Disabled,
                border: '1px solid #5E6D7A',
                color: '#AFB6BC',
                cursor: 'initial',

                '.icon': {
                    '& > svg': {
                        fill: '#AFB6BC'
                    }
                }
            },


            [theme.breakpoints.down('400')]: {
                fontSize: 16,
                marginBottom: 8,
                padding: '11px 16px'
            }
        },
        options: {
            borderRadius: theme.shape.borderRadius / 2,
            alignItems: 'center',
            display: 'flex',
            height: '100%',
            justifyContent: 'center',
            position: 'absolute',
            right: 0,
            top: 0,
            width: 36,

            '&:hover': {
                backgroundColor: '#0262B6'
            },

            '& svg': {
                pointerEvents: 'none'
            }
        }
    };
};

/**
 * Button used for pre meeting actions.
 *
 * @returns {ReactElement}
 */
function ActionButton({
    children,
    classes,
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

    const containerClasses = clsx(
        classes.actionButton,
        className && className,
        type,
        disabled && 'disabled'
    );

    return (
        <div
            aria-disabled = { disabled }
            aria-label = { ariaLabel }
            className = { containerClasses }
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
                      className = { classes.options }
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

export default withStyles(styles)(ActionButton);
