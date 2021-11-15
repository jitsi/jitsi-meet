// @flow

import { makeStyles } from '@material-ui/styles';
import React from 'react';

import QuickActionButton from '../../../base/components/buttons/QuickActionButton';

type Props = {

    /**
     * Label used for accessibility.
     */
    accessibilityLabel: string,

    /**
     * Component children.
     */
    children: string,

    /**
     * Button class name.
     */
    className?: string,

    /**
     * Click handler function.
     */
    onClick: Function,

    /**
     * Whether or not the button is secondary.
     */
    secondary?: boolean,

    /**
     * Data test id.
     */
    testId: string
}

const useStyles = makeStyles(theme => {
    return {
        secondary: {
            backgroundColor: theme.palette.ui04
        }
    };
});

const LobbyParticipantQuickAction = ({
    accessibilityLabel,
    children,
    className,
    onClick,
    secondary = false,
    testId
}: Props) => {
    const styles = useStyles();

    return (
        <QuickActionButton
            accessibilityLabel = { accessibilityLabel }
            className = { `${secondary ? styles.secondary : ''} ${className ?? ''}` }
            onClick = { onClick }
            testId = { testId }>
            {children}
        </QuickActionButton>
    );
};

export default LobbyParticipantQuickAction;
