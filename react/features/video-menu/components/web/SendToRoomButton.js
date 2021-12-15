// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { createBreakoutRoomsEvent, sendAnalytics } from '../../../analytics';
import ContextMenuItem from '../../../base/components/context-menu/ContextMenuItem';
import { IconRingGroup } from '../../../base/icons';
import { sendParticipantToRoom } from '../../../breakout-rooms/actions';

type Props = {

    /**
     * Click handler.
     */
    onClick: ?Function,

    /**
     * The ID for the participant on which the button will act.
     */
    participantID: string,

    /**
     * The room to send the participant to.
     */
    room: Object
}

const SendToRoomButton = ({ onClick, participantID, room }: Props) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const _onClick = useCallback(() => {
        onClick && onClick();
        sendAnalytics(createBreakoutRoomsEvent('send.participant.to.room'));
        dispatch(sendParticipantToRoom(participantID, room.id));
    }, [ participantID, room ]);

    const roomName = room.name || t('breakoutRooms.mainRoom');

    return (
        <ContextMenuItem
            accessibilityLabel = { roomName }
            icon = { IconRingGroup }
            onClick = { _onClick }
            text = { roomName } />
    );
};

export default SendToRoomButton;
