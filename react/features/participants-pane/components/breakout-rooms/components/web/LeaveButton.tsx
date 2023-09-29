import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { createBreakoutRoomsEvent } from '../../../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../../../analytics/functions';
import Button from '../../../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../../../base/ui/constants.web';
import { moveToRoom } from '../../../../../breakout-rooms/actions';

interface IProps {
    className?: string;
}

export const LeaveButton = ({ className }: IProps) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const onLeave = useCallback(() => {
        sendAnalytics(createBreakoutRoomsEvent('leave'));
        dispatch(moveToRoom());
    }, [ dispatch ]);

    return (
        <Button
            accessibilityLabel = { t('breakoutRooms.actions.leaveBreakoutRoom') }
            className = { className }
            fullWidth = { true }
            labelKey = { 'breakoutRooms.actions.leaveBreakoutRoom' }
            onClick = { onLeave }
            type = { BUTTON_TYPES.DESTRUCTIVE } />
    );
};
