import React, { ReactNode, useCallback } from 'react';
import { makeStyles } from 'tss-react/mui';

import Icon from '../../../icons/components/Icon';
import { IconArrowDown } from '../../../icons/svg';
import { withPixelLineHeight } from '../../../styles/functions.web';

interface IProps {

    /**
     * Icon to display in the options section.
     */
    OptionsIcon?: Function;

    /**
     * The Label of the child element.
     */
    ariaDropDownLabel?: string;

    /**
     * The Label of the current element.
     */
    ariaLabel?: string;

    /**
     * To give a aria-pressed to the icon.
     */
    ariaPressed?: boolean;

    /**
     * Text of the button.
     */
    children: ReactNode;

    /**
     * Text css class of the button.
     */
    className?: string;

    /**
     * If the button is disabled or not.
     */
    disabled?: boolean;

    /**
     * If the button has options.
     */
    hasOptions?: boolean;


    /**
     * OnClick button handler.
     */
    onClick?: (e?: React.MouseEvent) => void;

    /**
     * Click handler for options.
     */
    onOptionsClick?: (e?: React.KeyboardEvent | React.MouseEvent) => void;

    /**
     * To give a role to the icon.
     */
    role?: string;

    /**
     * To navigate with the keyboard.
     */
    tabIndex?: number;

    /**
     * TestId of the button. Can be used to locate element when testing UI.
     */
    testId?: string;

    /**
     * The type of th button: primary, secondary, text.
     */
    type: string;
}

const useStyles = makeStyles()(theme => {
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
            position: 'relative' as const,
            textAlign: 'center',
            width: '100%',
            border: 0,

            '&.primary': {
                background: theme.palette.action01,
                color: theme.palette.text01,

                '&:hover': {
                    backgroundColor: theme.palette.action01Hover
                }
            },

            '&.secondary': {
                background: theme.palette.action02,
                color: theme.palette.text04,

                '&:hover': {
                    backgroundColor: theme.palette.action02Hover
                }
            },

            '&.text': {
                width: 'auto',
                fontSize: '13px',
                margin: '0',
                padding: '0'
            },

            '&.disabled': {
                background: theme.palette.disabled01,
                border: '1px solid #5E6D7A',
                color: '#AFB6BC',
                cursor: 'initial',

                '.icon': {
                    '& > svg': {
                        fill: '#AFB6BC'
                    }
                }
            },


            [theme.breakpoints.down(400)]: {
                fontSize: 16,
                marginBottom: 8,
                padding: '11px 16px'
            }
        },
        options: {
            borderRadius: Number(theme.shape.borderRadius) / 2,
            alignItems: 'center',
            display: 'flex',
            height: '100%',
            justifyContent: 'center',
            position: 'absolute' as const,
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
});

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
}: IProps) {
    const { classes, cx } = useStyles();

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

    const containerClasses = cx(
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
                        size = { 24 }
                        src = { OptionsIcon } />
                </div>
            }
        </div>
    );
}

export default ActionButton;
