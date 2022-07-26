/* eslint-disable lines-around-comment */
import { makeStyles } from '@material-ui/styles';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

// @ts-ignore
import { createBreakoutRoomsEvent, sendAnalytics } from '../../../../../analytics';
import Button from '../../../../../base/ui/components/web/Button';
import { Theme } from '../../../../../base/ui/types';
// @ts-ignore
import { moveToRoom } from '../../../../../breakout-rooms/actions';

type Props = {

    /**
     * The room to join.
     */
    room: {
        id: string;
        jid: string;
    }
}

const useStyles = makeStyles((theme: Theme) => {
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

    return (
        <Button
            accessibilityLabel = { t('breakoutRooms.actions.join') }
            className = { styles.button }
            label = { t('breakoutRooms.actions.join') }
            onClick = { onJoinRoom }
            size = 'small'
            testId = { `join-room-${room.id}` } />
    );
};

export default JoinActionButton;
