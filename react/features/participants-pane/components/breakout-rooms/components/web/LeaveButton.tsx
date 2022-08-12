/* eslint-disable lines-around-comment */
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

// @ts-ignore
import { createBreakoutRoomsEvent, sendAnalytics } from '../../../../../analytics';
import Button from '../../../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../../../base/ui/constants';
// @ts-ignore
import { moveToRoom } from '../../../../../breakout-rooms/actions';

export const LeaveButton = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const onLeave = useCallback(() => {
        sendAnalytics(createBreakoutRoomsEvent('leave'));
        dispatch(moveToRoom());
    }, [ dispatch ]);

    return (
        <Button
            accessibilityLabel = { t('breakoutRooms.actions.leaveBreakoutRoom') }
            fullWidth = { true }
            labelKey = { 'breakoutRooms.actions.leaveBreakoutRoom' }
            onClick = { onLeave }
            type = { BUTTON_TYPES.DESTRUCTIVE } />
    );
};
