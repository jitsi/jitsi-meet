// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import conference from '../../../../conference';
import getRoomName from '../../base/config/getRoomName';
import { Icon, IconHangup } from '../../base/icons';

import { RoomLeaveButton } from './styled';

export const LeaveButton = () => {
    const { t } = useTranslation();

    const onLeave = useCallback(() => {
        const mainRoomName = getRoomName();

        conference.switchRoom(mainRoomName);
    });

    return (
        <RoomLeaveButton
            aria-label = { t('breakoutRooms.actions.leaveBreakoutRoom') }
            onClick = { onLeave }>
            <Icon
                size = { 20 }
                src = { IconHangup } />
            <span>{ t('breakoutRooms.actions.leaveBreakoutRoom') }</span>
        </RoomLeaveButton>
    );
};
