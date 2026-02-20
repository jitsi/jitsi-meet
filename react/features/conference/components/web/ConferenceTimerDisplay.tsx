import React from 'react';
import { makeStyles } from 'tss-react/mui';

import { withPixelLineHeight } from '../../../base/styles/functions.web';
import { IDisplayProps } from '../ConferenceTimer';

const useStyles = makeStyles()(theme => {
    return {
        timer: {
            ...withPixelLineHeight(theme.typography.labelRegular),
            color: '#000',
            padding: '6px 8px',
            backgroundColor: '#FE9C75',
            boxSizing: 'border-box',
            height: '28px',
            borderRadius: 32,
            marginRight: '2px',

            '@media (max-width: 300px)': {
                display: 'none'
            }
        }
    };
});

/**
 * Returns web element to be rendered.
 *
 * @returns {ReactElement}
 */
export default function ConferenceTimerDisplay({ timerValue, textStyle: _textStyle }: IDisplayProps) {
    const { classes } = useStyles();

    return (
        <span className = { classes.timer }>{ timerValue }</span>
    );
}
