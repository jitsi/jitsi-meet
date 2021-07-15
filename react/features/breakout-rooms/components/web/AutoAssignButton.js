// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { Icon, IconMeetingUnlocked } from '../../../base/icons';
import { autoAssignToBreakoutRooms } from '../../actions';

import { ParticipantsAutoAssignButton } from './styled';

export const AutoAssignButton = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const onAutoAssign = useCallback(() => {
        dispatch(autoAssignToBreakoutRooms());
    }, [ dispatch ]);

    return (
        <ParticipantsAutoAssignButton
            aria-label = { t('breakoutRooms.actions.autoAssign') }
            onClick = { onAutoAssign }>
            <Icon
                size = { 20 }
                src = { IconMeetingUnlocked } />
            <span>{ t('breakoutRooms.actions.autoAssign') }</span>
        </ParticipantsAutoAssignButton>
    );
};
