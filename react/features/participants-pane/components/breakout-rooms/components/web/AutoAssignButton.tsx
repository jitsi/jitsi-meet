import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import Button from '../../../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../../../base/ui/constants.web';
import { autoAssignToBreakoutRooms } from '../../../../../breakout-rooms/actions';

interface IProps {
    className?: string;
}

export const AutoAssignButton = ({ className }: IProps) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const onAutoAssign = useCallback(() => {
        dispatch(autoAssignToBreakoutRooms());
    }, [ dispatch ]);

    return (
        <Button
            accessibilityLabel = { t('breakoutRooms.actions.autoAssign') }
            className = { className }
            fullWidth = { true }
            labelKey = { 'breakoutRooms.actions.autoAssign' }
            onClick = { onAutoAssign }
            type = { BUTTON_TYPES.TERTIARY } />
    );
};
