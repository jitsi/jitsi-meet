// @flow
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';

// import { useTranslation } from 'react-i18next';

import { Switch } from '../../../base/react';


const useStyles = makeStyles(theme => {
    return {
        switchContainer: {
            position: 'absolute',
            top: 90,
            left: 226,
            display: 'flex',
            alignItems: 'center',

            '& svg': {
                display: 'none'

            },
            '& div > label': {
                width: 32,
                height: 20,
                backgroundColor: '#484A4F',
                '&:not([data-checked]):hover': {
                    backgroundColor: '#484A4F'
                },
                '&[data-checked]': {
                    backgroundColor: theme.palette.action01,
                    '&:hover': {
                        backgroundColor: theme.palette.action01
                    },
                    '&::before': {
                        margin: '0 0 1.5px -3px',
                        backgroundColor: theme.palette.text01
                    }
                },
                '&:focus-within': {
                    border: 'none'
                },
                '&::before': {
                    width: 14,
                    height: 14,
                    margin: '0 0 1.5px 1.5px',
                    backgroundColor: theme.palette.text01
                }
            }
        },
        switchLabel: {
            marginRight: 10
        }
    };
});

/**
 * The type of the React {@code Component} props of {@link ToggleFacialExpressionsButton}.
 */
type Props = {

    /**
     * The function to initiate the change in the speaker stats table.
     */
    onChange: Function,

    /**
     * The state of the button.
     */
    showFacialExpressions: boolean,

};

/**
 * React component for toggling facial expressions grid.
 *
 * @returns {React$Element<any>}
 */
export default function FacialExpressionsSwitch({ onChange, showFacialExpressions }: Props) {
    const classes = useStyles();

    // const { t } = useTranslation();

    return (
        <div className = { classes.switchContainer } >
            <label
                className = { `text-large ${classes.switchLabel}` }
                htmlFor = 'facial-expressions-switch'>
                Display Emotions
            </label>
            <Switch
                id = 'facial-expressions-switch'
                onValueChange = { onChange }
                trackColor = {{ false: 'blue' }}
                value = { showFacialExpressions } />
        </div>
    );
}
