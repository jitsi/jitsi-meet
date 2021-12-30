// @flow
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { useTranslation } from 'react-i18next';

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
 * The type of the React {@code Component} props of {@link ToggleFacialExpressionsButton}.
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
 * React component for toggling facial expressions grid.
 *
 * @returns {React$Element<any>}
 */
export default function ToggleFacialExpressionsButton({ onClick, showFacialExpressions }: Props) {
    const classes = useStyles();
    const { t } = useTranslation();

    const onClickCallback = React.useCallback(() => {
        onClick();
    }, []);

    return (
        <Tooltip
            content = { t(`speakerStats.${showFacialExpressions ? 'hide' : 'show'}FacialExpressions`) }
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
