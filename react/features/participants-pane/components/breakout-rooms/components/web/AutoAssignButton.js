// @flow

import { makeStyles } from '@material-ui/styles';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { autoAssignToBreakoutRooms } from '../../../../../breakout-rooms/actions';
import ParticipantPaneBaseButton from '../../../web/ParticipantPaneBaseButton';

const useStyles = makeStyles(theme => {
    return {
        button: {
            color: theme.palette.link01,
            width: '100%',
            backgroundColor: 'transparent',

            '&:hover': {
                backgroundColor: 'transparent'
            }
        }
    };
});

export const AutoAssignButton = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const styles = useStyles();

    const onAutoAssign = useCallback(() => {
        dispatch(autoAssignToBreakoutRooms());
    }, [ dispatch ]);

    return (
        <ParticipantPaneBaseButton
            accessibilityLabel = { t('breakoutRooms.actions.autoAssign') }
            className = { styles.button }
            onClick = { onAutoAssign }>
            {t('breakoutRooms.actions.autoAssign')}
        </ParticipantPaneBaseButton>
    );
};
