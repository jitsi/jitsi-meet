import { Theme } from '@mui/material';
import { withStyles } from '@mui/styles';
import React from 'react';

import Icon from '../../base/icons/components/Icon';

type Props = {

    /**
     * The css classes generated from theme.
     */
    classes: any;

    /**
     * Attribute used in automated testing.
     */
    dataTestId: string;

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
};

/**
 * Creates the styles for the component.
 *
 * @param {Object} theme - The current UI theme.
 *
 * @returns {Object}
 */
const styles = (theme: Theme) => {
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
};

/**
 * Buttons used for pre meeting actions.
 *
 * @returns {ReactElement}
 */
const DropdownButton = ({
    classes,
    dataTestId,
    icon,
    onButtonClick,
    onKeyPressed,
    label
}: Props) => (
    <div
        className = { classes.prejoinPreviewDropdownBtn }
        data-testid = { dataTestId }
        onClick = { onButtonClick }
        onKeyPress = { onKeyPressed }
        role = 'button'
        tabIndex = { 0 }>
        <Icon
            className = { classes.prejoinPreviewDropdownIcon }
            size = { 24 }
            src = { icon } />
        {label}
    </div>
);

export default withStyles(styles)(DropdownButton);
