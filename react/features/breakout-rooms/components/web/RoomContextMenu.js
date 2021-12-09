// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { createBreakoutRoomsEvent, sendAnalytics } from '../../../analytics';
import { ContextMenu, ContextMenuItemGroup } from '../../../base/components';
import {
    IconClose,
    IconRingGroup
} from '../../../base/icons';
import { isLocalParticipantModerator } from '../../../base/participants';
import { showOverflowDrawer } from '../../../toolbox/functions.web';
import { closeBreakoutRoom, moveToRoom, removeBreakoutRoom } from '../../actions';

type Props = {

    /**
         * Room reference.
         */
    entity: Object,

    /**
     * Target elements against which positioning calculations are made.
     */
    offsetTarget: HTMLElement,

    /**
     * Callback for the mouse entering the component.
     */
    onEnter: Function,

    /**
     * Callback for the mouse leaving the component.
     */
    onLeave: Function,

    /**
     * Callback for making a selection in the menu.
     */
    onSelect: Function
};

export const RoomContextMenu = ({
    entity: room,
    offsetTarget,
    onEnter,
    onLeave,
    onSelect
}: Props) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const isLocalModerator = useSelector(isLocalParticipantModerator);
    const _overflowDrawer = useSelector(showOverflowDrawer);

    const onJoinRoom = useCallback(() => {
        sendAnalytics(createBreakoutRoomsEvent('join'));
        dispatch(moveToRoom(room.jid));
    }, [ dispatch, room ]);

    const onRemoveBreakoutRoom = useCallback(() => {
        dispatch(removeBreakoutRoom(room.jid));
    }, [ dispatch, room ]);

    const onCloseBreakoutRoom = useCallback(() => {
        dispatch(closeBreakoutRoom(room.id));
    }, [ dispatch, room ]);

    const isRoomEmpty = !(room?.participants && Object.keys(room.participants).length > 0);

    const actions = [
        _overflowDrawer ? {
            accessibilityLabel: t('breakoutRooms.actions.join'),
            icon: IconRingGroup,
            onClick: onJoinRoom,
            text: t('breakoutRooms.actions.join')
        } : null,
        !room?.isMainRoom && isLocalModerator ? {
            accessibilityLabel: isRoomEmpty ? t('breakoutRooms.actions.remove') : t('breakoutRooms.actions.close'),
            icon: IconClose,
            id: isRoomEmpty ? `remove-room-${room?.id}` : `close-room-${room?.id}`,
            onClick: isRoomEmpty ? onRemoveBreakoutRoom : onCloseBreakoutRoom,
            text: isRoomEmpty ? t('breakoutRooms.actions.remove') : t('breakoutRooms.actions.close')
        } : null
    ].filter(Boolean);

    const lowerMenu = useCallback(() => onSelect(true));

    return (
        <ContextMenu
            entity = { room }
            isDrawerOpen = { room }
            offsetTarget = { offsetTarget }
            onClick = { lowerMenu }
            onDrawerClose = { onSelect }
            onMouseEnter = { onEnter }
            onMouseLeave = { onLeave }>
            <ContextMenuItemGroup actions = { actions } />
        </ContextMenu>
    );
};
