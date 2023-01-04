import React, { useCallback } from 'react';
import { makeStyles } from 'tss-react/mui';

import Icon from '../../../base/icons/components/Icon';

interface IProps {

    /**
     * Attribute used in automated testing.
     */
    dataTestId: string;

    /**
     * Whether the button is disabled.
     */
    disabled: boolean;

    /**
     * The button's icon.
     */
    icon: Function;

    /**
     * The button's label.
     */
    label: string;

    /**
     * Function to be called when button is clicked.
     */
    onButtonClick: (e?: React.MouseEvent) => void;

    /**
     * Function to be called on key pressed.
     */
    onKeyPressed: (e?: React.KeyboardEvent) => void;
}


const useStyles = makeStyles()(theme => {
    return {
        prejoinPreviewDropdownBtn: {
            alignItems: 'center',
            color: '#1C2025',
            cursor: 'pointer',
            display: 'flex',
            height: 40,
            fontSize: 15,
            lineHeight: '24px',
            padding: '0 16px', // @ts-ignore
            backgroundColor: theme.palette.field02,

            '&:hover': { // @ts-ignore
                backgroundColor: theme.palette.field02Hover
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
            }
        },
        prejoinPreviewDropdownIcon: {
            display: 'inline-block',
            marginRight: 16,

            '& > svg': {
                fill: '#1C2025'
            }
        }
    };
});

/**
 * Buttons used for pre meeting actions.
 *
 * @returns {ReactElement}
 */
const DropdownButton = ({
    dataTestId,
    disabled,
    icon,
    onButtonClick,
    onKeyPressed,
    label
}: IProps) => {
    const { classes, cx } = useStyles();
    const containerClasses = cx(
        classes.prejoinPreviewDropdownBtn,
        disabled && 'disabled'
    );

    const onClick = useCallback(() =>
        !disabled && onButtonClick(), [ disabled ]);

    const onKeyPress = useCallback(() =>
        !disabled && onKeyPressed(), [ disabled ]);

    return (
        <div
            className = { containerClasses }
            data-testid = { dataTestId }
            onClick = { onClick }
            onKeyPress = { onKeyPress }
            role = 'button'
            tabIndex = { 0 }>
            <Icon
                className = { classes.prejoinPreviewDropdownIcon }
                color = '#1C2025'
                size = { 24 }
                src = { icon } />
            {label}
        </div>
    );
};

export default DropdownButton;
