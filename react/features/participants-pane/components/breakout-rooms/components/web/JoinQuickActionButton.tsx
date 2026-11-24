import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { createBreakoutRoomsEvent } from '../../../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../../../analytics/functions';
import { IReduxState } from '../../../../../app/types';
import Button from '../../../../../base/ui/components/web/Button';
import { moveToRoom } from '../../../../../breakout-rooms/actions';
import { isBreakoutRoomJoinAllowed } from '../../../../../breakout-rooms/functions';
import { IRoom } from '../../../../../breakout-rooms/types';

interface IProps {

    /**
     * The room to join.
     */
    room: IRoom;
}

const useStyles = makeStyles()(theme => {
    return {
        button: {
            marginRight: theme.spacing(2)
        }
    };
});

const JoinActionButton = ({ room }: IProps) => {
    const { classes: styles } = useStyles();
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const joinAllowed = useSelector((state: IReduxState) => isBreakoutRoomJoinAllowed(state, room));

    const onJoinRoom = useCallback(e => {
        e.stopPropagation();
        sendAnalytics(createBreakoutRoomsEvent('join'));
        dispatch(moveToRoom(room.jid));
    }, [ dispatch, room ]);

    if (!joinAllowed) {
        return null;
    }

    return (
        <Button
            accessibilityLabel = { t('breakoutRooms.actions.join') }
            className = { styles.button }
            labelKey = { 'breakoutRooms.actions.join' }
            onClick = { onJoinRoom }
            size = 'small'
            testId = { `join-room-${room.id}` } />
    );
};

export default JoinActionButton;
