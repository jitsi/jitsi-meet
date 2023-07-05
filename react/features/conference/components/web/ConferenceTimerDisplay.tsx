import React from 'react';
import { makeStyles } from 'tss-react/mui';

import { withPixelLineHeight } from '../../../base/styles/functions.web';
import { IDisplayProps } from '../ConferenceTimer';

const useStyles = makeStyles()(theme => {
    return {
        timer: {
            ...withPixelLineHeight(theme.typography.labelRegular),
            color: theme.palette.text01,
            padding: '6px 8px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            boxSizing: 'border-box',
            height: '28px',
            borderRadius: `0 ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0`,
            marginRight: '2px',

            '@media (max-width: 300px)': {
                display: 'none'
            }
        },

        inToolbar: {
            padding: theme.spacing(1),
            height: 'auto',
            borderRadius: `${theme.shape.borderRadius / 2}px`,
            backgroundColor: 'rgba(255, 255, 255, 0.20)'
        }
    };
});

/**
 * Returns web element to be rendered.
 *
 * @returns {ReactElement}
 */
export default function ConferenceTimerDisplay({ inToolbar, timerValue, textStyle: _textStyle }: IDisplayProps) {
    const { classes, cx } = useStyles();

    return (
        <span className = { cx(classes.timer, inToolbar && classes.inToolbar) }>{ timerValue }</span>
    );
}
