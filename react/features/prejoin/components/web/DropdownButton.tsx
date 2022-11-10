import React from 'react';
import { makeStyles } from 'tss-react/mui';

import Icon from '../../../base/icons/components/Icon';

interface IProps {

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
    icon,
    onButtonClick,
    onKeyPressed,
    label
}: IProps) => {
    const { classes } = useStyles();

    return (
        <div
            className = { classes.prejoinPreviewDropdownBtn }
            data-testid = { dataTestId }
            onClick = { onButtonClick }
            onKeyPress = { onKeyPressed }
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
