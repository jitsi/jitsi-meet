import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { createBreakoutRoomsEvent } from '../../../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../../../analytics/functions';
import { openDialog } from '../../../../../base/dialog/actions';
import { IconCloseLarge, IconEdit, IconRingGroup } from '../../../../../base/icons/svg';
import { isLocalParticipantModerator } from '../../../../../base/participants/functions';
import ContextMenu from '../../../../../base/ui/components/web/ContextMenu';
import ContextMenuItemGroup from '../../../../../base/ui/components/web/ContextMenuItemGroup';
import { closeBreakoutRoom, moveToRoom, removeBreakoutRoom } from '../../../../../breakout-rooms/actions';
import { IRoom } from '../../../../../breakout-rooms/types';
import { showOverflowDrawer } from '../../../../../toolbox/functions.web';
import { isBreakoutRoomRenameAllowed } from '../../../../functions';

import BreakoutRoomNamePrompt from './BreakoutRoomNamePrompt';


interface IProps {

    /**
     * Room reference.
     */
    entity?: IRoom;

    /**
     * Target elements against which positioning calculations are made.
     */
    offsetTarget?: HTMLElement | null;

    /**
     * Callback for the mouse entering the component.
     */
    onEnter: (e?: React.MouseEvent) => void;

    /**
     * Callback for the mouse leaving the component.
     */
    onLeave: (e?: React.MouseEvent) => void;

    /**
     * Callback for making a selection in the menu.
     */
    onSelect: (e?: React.MouseEvent | boolean) => void;
}

export const RoomContextMenu = ({
    entity: room,
    offsetTarget,
    onEnter,
    onLeave,
    onSelect
}: IProps) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const isLocalModerator = useSelector(isLocalParticipantModerator);
    const _isBreakoutRoomRenameAllowed = useSelector(isBreakoutRoomRenameAllowed);
    const _overflowDrawer = useSelector(showOverflowDrawer);

    const onJoinRoom = useCallback(() => {
        sendAnalytics(createBreakoutRoomsEvent('join'));
        dispatch(moveToRoom(room?.jid));
    }, [ dispatch, room ]);

    const onRemoveBreakoutRoom = useCallback(() => {
        dispatch(removeBreakoutRoom(room?.jid ?? ''));
    }, [ dispatch, room ]);

    const onRenameBreakoutRoom = useCallback(() => {
        dispatch(openDialog(BreakoutRoomNamePrompt, {
            breakoutRoomJid: room?.jid,
            initialRoomName: room?.name
        }));
    }, [ dispatch, room ]);

    const onCloseBreakoutRoom = useCallback(() => {
        dispatch(closeBreakoutRoom(room?.id ?? ''));
    }, [ dispatch, room ]);

    const isRoomEmpty = !(room?.participants && Object.keys(room.participants).length > 0);

    const actions = [
        _overflowDrawer ? {
            accessibilityLabel: t('breakoutRooms.actions.join'),
            icon: IconRingGroup,
            onClick: onJoinRoom,
            text: t('breakoutRooms.actions.join')
        } : null,
        !room?.isMainRoom && _isBreakoutRoomRenameAllowed ? {
            accessibilityLabel: t('breakoutRooms.actions.rename'),
            icon: IconEdit,
            id: `rename-room-${room?.id}`,
            onClick: onRenameBreakoutRoom,
            text: t('breakoutRooms.actions.rename')
        } : null,
        !room?.isMainRoom && isLocalModerator ? {
            accessibilityLabel: isRoomEmpty ? t('breakoutRooms.actions.remove') : t('breakoutRooms.actions.close'),
            icon: IconCloseLarge,
            id: isRoomEmpty ? `remove-room-${room?.id}` : `close-room-${room?.id}`,
            onClick: isRoomEmpty ? onRemoveBreakoutRoom : onCloseBreakoutRoom,
            text: isRoomEmpty ? t('breakoutRooms.actions.remove') : t('breakoutRooms.actions.close')
        } : null
    ].filter(Boolean);

    const lowerMenu = useCallback(() => onSelect(true), []);

    return (
        <ContextMenu
            activateFocusTrap = { true }
            entity = { room }
            isDrawerOpen = { Boolean(room) }
            offsetTarget = { offsetTarget }
            onClick = { lowerMenu }
            onDrawerClose = { onSelect }
            onMouseEnter = { onEnter }
            onMouseLeave = { onLeave }>
            {/* @ts-ignore */}
            <ContextMenuItemGroup actions = { actions } />
        </ContextMenu>
    );
};
