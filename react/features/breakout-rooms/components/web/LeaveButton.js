// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { Icon, IconHangup } from '../../../base/icons';
import { moveToMainRoom } from '../../actions';

import { RoomLeaveButton } from './styled';

export const LeaveButton = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const onLeave = useCallback(() => {
        dispatch(moveToMainRoom());
    }, [ dispatch ]);

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
