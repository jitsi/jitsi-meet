// @flow

import { makeStyles } from '@material-ui/styles';
import React from 'react';

type Props = {

    /**
     * Label used for accessibility.
     */
    accessibilityLabel: string,

    /**
     * Additional class name for custom styles.
     */
    className: string,

    /**
     * Children of the component.
     */
    children: string | React$Node,

    /**
     * Click handler
     */
    onClick: Function,

    /**
     * Data test id.
     */
    testId?: string
}

const useStyles = makeStyles(theme => {
    return {
        button: {
            backgroundColor: theme.palette.action01,
            color: theme.palette.text01,
            borderRadius: `${theme.shape.borderRadius}px`,
            ...theme.typography.labelBold,
            lineHeight: `${theme.typography.labelBold.lineHeight}px`,
            padding: '8px 12px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            border: 0,

            '&:hover': {
                backgroundColor: theme.palette.action01Hover
            }
        }
    };
});

const QuickActionButton = ({ accessibilityLabel, className, children, onClick, testId }: Props) => {
    const styles = useStyles();

    return (<button
        aria-label = { accessibilityLabel }
        className = { `${styles.button} ${className}` }
        data-testid = { testId }
        onClick = { onClick }>
        {children}
    </button>);
};

export default QuickActionButton;
