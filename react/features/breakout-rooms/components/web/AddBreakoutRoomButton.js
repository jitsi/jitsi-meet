// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { Icon, IconAdd } from '../../../base/icons';
import { createBreakoutRoom } from '../../actions';

import { RoomAddButton } from './styled';

export const AddBreakoutRoomButton = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const onAdd = useCallback(() => dispatch(createBreakoutRoom()), [ dispatch ]);

    return (
        <RoomAddButton
            aria-label = { t('breakoutRooms.actions.add') }
            onClick = { onAdd }>
            <Icon
                size = { 20 }
                src = { IconAdd } />
            <span>{ t('breakoutRooms.actions.add') }</span>
        </RoomAddButton>
    );
};
