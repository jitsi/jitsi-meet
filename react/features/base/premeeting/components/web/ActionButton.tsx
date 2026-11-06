import React, { ReactNode } from 'react';
import { makeStyles } from 'tss-react/mui';

import Icon from '../../../icons/components/Icon';
import { IconArrowDown } from '../../../icons/svg';

interface IProps {

    /**
     * Icon to display in the options section.
     */
    OptionsIcon?: Function;

    /**
     * The accessible name of the options button.
     */
    ariaDropDownLabel?: string;

    /**
     * The accessible name of the main button.
     */
    ariaLabel?: string;

    /**
     * Rendered as aria-pressed on the options button.
     */
    ariaPressed?: boolean;

    /**
     * Text of the button.
     */
    children: ReactNode;

    /**
     * Extra css class for the component's container.
     */
    className?: string;

    /**
     * If the buttons are disabled or not. Native disabled buttons are not focusable and ignore clicks and
     * key presses, so both buttons leave the tab order together with their handlers.
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
     * TestId of the main button. Can be used to locate element when testing UI.
     */
    testId?: string;

    /**
     * The type of the button: primary, secondary, text.
     */
    type: string;
}

const useStyles = makeStyles()(theme => {
    return {
        container: {
            display: 'inline-block',
            marginBottom: '16px',
            position: 'relative' as const,
            width: '100%',

            // The options button is a sibling of the main button, so hovering it no longer hovers the main
            // button. Driving the hover colour from the container keeps the whole control highlighted as one.
            '&:hover > .primary:not(:disabled)': {
                backgroundColor: theme.palette.prejoinActionButtonPrimaryHover
            },

            '&:hover > .secondary:not(:disabled)': {
                backgroundColor: theme.palette.prejoinActionButtonSecondaryHover
            },

            '&.text': {
                width: 'auto',
                margin: 0
            },

            [theme.breakpoints.down(400)]: {
                marginBottom: 8
            }
        },
        actionButton: {
            ...theme.typography.bodyLongBold,
            background: 'none',
            border: 0,
            borderRadius: theme.shape.borderRadius,
            boxSizing: 'border-box',
            color: theme.palette.actionButtonText,
            cursor: 'pointer',
            display: 'block',
            padding: '7px 16px',
            textAlign: 'center',
            width: '100%',

            '&.primary': {
                background: theme.palette.prejoinActionButtonPrimary,
                color: theme.palette.prejoinActionButtonPrimaryText
            },

            '&.secondary': {
                background: theme.palette.prejoinActionButtonSecondary,
                color: theme.palette.prejoinActionButtonSecondaryText
            },

            '&.text': {
                width: 'auto',
                fontSize: '0.875rem',
                padding: '0'
            },

            '&:disabled': {
                background: theme.palette.prejoinActionButtonDisabled,
                border: '1px solid #5E6D7A',
                color: '#AFB6BC',
                cursor: 'initial'
            },

            [theme.breakpoints.down(400)]: {
                fontSize: '1rem',
                padding: '11px 16px'
            }
        },
        options: {
            background: 'none',
            border: 0,
            borderRadius: Number(theme.shape.borderRadius) / 2,

            // The options area sits flush with the button's right edge, so its outer corners must follow the
            // button's radius, which can be customized through the theme.
            borderTopRightRadius: 'inherit',
            borderBottomRightRadius: 'inherit',
            alignItems: 'center',
            color: 'inherit',
            cursor: 'pointer',
            display: 'flex',
            height: '100%',
            justifyContent: 'center',
            padding: 0,
            position: 'absolute' as const,
            right: 0,
            top: 0,
            width: 36,

            '&:hover:not(:disabled)': {
                backgroundColor: theme.palette.prejoinActionButtonOptionsHover
            },

            '&:disabled': {
                cursor: 'initial',

                '& .icon > svg': {
                    fill: '#AFB6BC'
                }
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
 * The main button and the options button are two sibling native buttons. A button nested in another button
 * is presentational for assistive technologies, so the previous nested markup could hide the options button
 * from screen readers. Native buttons also give the tab order, Enter/Space activation and the disabled state
 * without custom key handling.
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
    ariaPressed,
    ariaLabel,
    ariaDropDownLabel
}: IProps) {
    const { classes, cx } = useStyles();

    return (
        <div className = { cx(classes.container, className && className, type) }>
            <button
                aria-label = { ariaLabel }
                className = { cx(classes.actionButton, type) }
                data-testid = { testId ? testId : undefined }
                disabled = { disabled }
                onClick = { onClick }
                type = 'button'>
                {children}
            </button>
            { hasOptions
                && <button
                    aria-haspopup = 'true'
                    aria-label = { ariaDropDownLabel }
                    aria-pressed = { ariaPressed }
                    className = { classes.options }
                    data-testid = 'prejoin.joinOptions'
                    disabled = { disabled }
                    onClick = { onOptionsClick }
                    type = 'button'>
                    <Icon
                        className = 'icon'
                        size = { 24 }
                        src = { OptionsIcon } />
                </button>
            }
        </div>
    );
}

export default ActionButton;
