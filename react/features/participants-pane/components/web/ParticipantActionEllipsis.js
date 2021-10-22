// @flow

import { makeStyles } from '@material-ui/styles';
import React from 'react';

import QuickActionButton from '../../../base/components/buttons/QuickActionButton';
import { Icon, IconHorizontalPoints } from '../../../base/icons';

type Props = {

    /**
     * Label used for accessibility.
     */
    accessibilityLabel: string,

    /**
     * Click handler function.
     */
    onClick: Function
}

const useStyles = makeStyles(() => {
    return {
        button: {
            padding: '6px'
        }
    };
});

const ParticipantActionEllipsis = ({ accessibilityLabel, onClick }: Props) => {
    const styles = useStyles();

    return (
        <QuickActionButton
            accessibilityLabel = { accessibilityLabel }
            className = { styles.button }
            onClick = { onClick }>
            <Icon src = { IconHorizontalPoints } />
        </QuickActionButton>
    );
};

export default ParticipantActionEllipsis;
