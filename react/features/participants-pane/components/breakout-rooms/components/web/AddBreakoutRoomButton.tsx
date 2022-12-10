import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import Button from '../../../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../../../base/ui/constants.web';
import { createBreakoutRoom } from '../../../../../breakout-rooms/actions';

export const AddBreakoutRoomButton = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const onAdd = useCallback(() =>
        dispatch(createBreakoutRoom())
    , [ dispatch ]);

    return (
        <Button
            accessibilityLabel = { t('breakoutRooms.actions.add') }
            fullWidth = { true }
            labelKey = { 'breakoutRooms.actions.add' }
            onClick = { onAdd }
            type = { BUTTON_TYPES.SECONDARY } />
    );
};
