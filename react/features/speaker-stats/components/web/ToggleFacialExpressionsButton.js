// @flow
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';

import {
    Icon,
    IconArrowDownSmall
} from '../../../base/icons';
import { Tooltip } from '../../../base/tooltip';


const useStyles = makeStyles(theme => {
    return {
        expandButton: {
            position: 'absolute',
            right: '24px',
            top: '93px',
            '&:hover': {
                backgroundColor: theme.palette.ui03
            },
            padding: '12px',
            borderRadius: '6px',
            cursor: 'pointer'
        },
        arrowRight: {
            transform: 'rotate(-90deg)'
        },
        arrowLeft: {
            transform: 'rotate(90deg)'
        }
    };
});

/**
 * The type of the React {@code Component} props of {@link SpeakerStatsSearch}.
 */
type Props = {

    /**
     * The function to initiate the change in the speaker stats table.
     */
    onClick: Function,

    /**
     * The state of the button.
     */
    showFacialExpressions: boolean,

};

/**
 */
export default function ToggleFacialExpressionsButton({ onClick, showFacialExpressions }: Props) {
    const classes = useStyles();

    const onClickCallback = React.useCallback(() => {
        onClick();
    }, []);

    return (
        <Tooltip
            content = { `${showFacialExpressions ? 'Hide' : 'Show'} facial expressions` }
            position = { 'top' } >
            <div
                className = { classes.expandButton }
                onClick = { onClickCallback }
                role = 'button'
                tabIndex = { 0 }>
                <Icon
                    className = { showFacialExpressions ? classes.arrowLeft : classes.arrowRight }
                    size = { 24 }
                    src = { IconArrowDownSmall } />
            </div>
        </Tooltip>
    );
}
