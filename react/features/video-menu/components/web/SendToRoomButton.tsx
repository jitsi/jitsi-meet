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
import { IButtonProps } from '../../types';

interface IProps extends IButtonProps {

    /**
     * Click handler.
     */
    onClick?: Function;

    /**
     * The room to send the participant to.
     */
    room: IRoom;
}

const SendToRoomButton = ({
    notifyClick,
    notifyMode,
    onClick,
    participantID,
    room
}: IProps) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const _onClick = useCallback(() => {
        notifyClick?.();
        if (notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
            return;
        }
        onClick?.();
        sendAnalytics(createBreakoutRoomsEvent('send.participant.to.room'));
        dispatch(sendParticipantToRoom(participantID, room.id));
    }, [ dispatch, notifyClick, notifyMode, onClick, participantID, room, sendAnalytics ]);

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
