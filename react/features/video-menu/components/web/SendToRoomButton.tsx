import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { createBreakoutRoomsEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IconRingGroup } from '../../../base/icons/svg';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import { sendParticipantToRoom } from '../../../breakout-rooms/actions';
import { IRoom } from '../../../breakout-rooms/types';
import { NOTIFY_CLICK_MODE } from '../../../toolbox/constants';

interface IProps {

    /**
     * The button key used to identify the click event.
     */
    buttonKey: string;

    /**
     * Callback to execute when the button is clicked.
     */
    notifyClick?: Function;

    /**
     * Notify mode for `participantMenuButtonClicked` event -
     * whether to only notify or to also prevent button click routine.
     */
    notifyMode?: string;

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

const SendToRoomButton = ({ buttonKey, notifyClick, notifyMode, onClick, participantID, room }: IProps) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const _onClick = useCallback(() => {
        notifyClick?.(buttonKey, participantID);
        if (notifyMode !== NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
            onClick?.();
            sendAnalytics(createBreakoutRoomsEvent('send.participant.to.room'));
            dispatch(sendParticipantToRoom(participantID, room.id));
        }
    }, [
        buttonKey,
        createBreakoutRoomsEvent,
        dispatch,
        notifyClick,
        notifyMode,
        onClick,
        participantID,
        room,
        sendAnalytics,
        sendParticipantToRoom
    ]);

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
