import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { createBreakoutRoomsEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IconRingGroup } from '../../../base/icons/svg';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import { sendParticipantToRoom } from '../../../breakout-rooms/actions';
import { IRoom } from '../../../breakout-rooms/types';

interface IProps {

    /**
     * Click handler.
     */
    onClick?: Function;

    /**
     * The ID for the participant on which the button will act.
     */
    participantID: string;

    /**
     * The room to send the participant to.
     */
    room: IRoom;
}

const SendToRoomButton = ({ onClick, participantID, room }: IProps) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const _onClick = useCallback(() => {
        onClick?.();
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
