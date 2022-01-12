// @flow
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';

// import { useTranslation } from 'react-i18next';

import { Switch } from '../../../base/react';


const useStyles = makeStyles(() => {
    return {
        facialExpressionsSwitchContainer: {
            position: 'absolute',
            top: 90,
            left: 226,
            display: 'flex',
            alignItems: 'center'
        },
        facialExpressionsSwitchLabel: {
            width: 100,
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
        <div className = { classes.facialExpressionsSwitchContainer } >
            <label
                className = { classes.facialExpressionsSwitchLabel }
                htmlFor = 'facial-expressions-switch'>
                Display Emotions
            </label>
            <Switch
                id = 'facial-expressions-switch'
                onValueChange = { onChange }
                value = { showFacialExpressions } />
        </div>
    );
}
