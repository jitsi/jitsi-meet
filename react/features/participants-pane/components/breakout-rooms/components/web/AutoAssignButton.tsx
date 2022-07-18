/* eslint-disable lines-around-comment */
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import Button from '../../../../../base/components/common/Button';
// @ts-ignore
import { autoAssignToBreakoutRooms } from '../../../../../breakout-rooms/actions';

export const AutoAssignButton = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const onAutoAssign = useCallback(() => {
        dispatch(autoAssignToBreakoutRooms());
    }, [ dispatch ]);

    return (
        <Button
            accessibilityLabel = { t('breakoutRooms.actions.autoAssign') }
            fullWidth = { true }
            onClick = { onAutoAssign }
            text = { t('breakoutRooms.actions.autoAssign') }
            type = 'tertiary' />
    );
};
