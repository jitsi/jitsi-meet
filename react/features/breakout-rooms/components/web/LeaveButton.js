// @flow

import { makeStyles } from '@material-ui/styles';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { createBreakoutRoomsEvent, sendAnalytics } from '../../../analytics';
import ParticipantPaneBaseButton from '../../../participants-pane/components/web/ParticipantPaneBaseButton';
import { moveToRoom } from '../../actions';

const useStyles = makeStyles(theme => {
    return {
        button: {
            color: theme.palette.textError,
            backgroundColor: 'transparent',
            width: '100%',

            '&:hover': {
                backgroundColor: 'transparent'
            }
        }
    };
});

export const LeaveButton = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const styles = useStyles();

    const onLeave = useCallback(() => {
        sendAnalytics(createBreakoutRoomsEvent('leave'));
        dispatch(moveToRoom());
    }, [ dispatch ]);

    return (
        <ParticipantPaneBaseButton
            accessibilityLabel = { t('breakoutRooms.actions.leaveBreakoutRoom') }
            className = { styles.button }
            onClick = { onLeave }>
            {t('breakoutRooms.actions.leaveBreakoutRoom')}
        </ParticipantPaneBaseButton>
    );
};
