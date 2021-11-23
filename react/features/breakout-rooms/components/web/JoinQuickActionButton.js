// @flow

import { makeStyles } from '@material-ui/styles';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { createBreakoutRoomsEvent, sendAnalytics } from '../../../analytics';
import { QuickActionButton } from '../../../base/components';
import { moveToRoom } from '../../actions';

type Props = {

    /**
     * The room to join.
     */
    room: Object
}

const useStyles = makeStyles(theme => {
    return {
        button: {
            marginRight: `${theme.spacing(2)}px`
        }
    };
});

const JoinActionButton = ({ room }: Props) => {
    const styles = useStyles();
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const onJoinRoom = useCallback(e => {
        e.stopPropagation();
        sendAnalytics(createBreakoutRoomsEvent('join'));
        dispatch(moveToRoom(room.jid));
    }, [ dispatch, room ]);

    return (<QuickActionButton
        accessibilityLabel = { t('breakoutRooms.actions.join') }
        className = { styles.button }
        onClick = { onJoinRoom }
        testId = { `join-room-${room.id}` }>
        {t('breakoutRooms.actions.join')}
    </QuickActionButton>
    );
};

export default JoinActionButton;
