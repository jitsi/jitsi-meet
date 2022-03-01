// @flow

import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';

import useContextMenu from '../../../../../base/components/context-menu/useContextMenu';
import { getParticipantCount, isLocalParticipantModerator } from '../../../../../base/participants';
import { equals } from '../../../../../base/redux';
import {
    getBreakoutRooms,
    isInBreakoutRoom,
    getCurrentRoomId,
    getBreakoutRoomsConfig
} from '../../../../../breakout-rooms/functions';
import { showOverflowDrawer } from '../../../../../toolbox/functions';

import { AutoAssignButton } from './AutoAssignButton';
import { CollapsibleRoom } from './CollapsibleRoom';
import JoinActionButton from './JoinQuickActionButton';
import { LeaveButton } from './LeaveButton';
import RoomActionEllipsis from './RoomActionEllipsis';
import { RoomContextMenu } from './RoomContextMenu';

type Props = {

    /**
     * Participants search string.
     */
    searchString: string
}

export const RoomList = ({ searchString }: Props) => {
    const currentRoomId = useSelector(getCurrentRoomId);
    const rooms = Object.values(useSelector(getBreakoutRooms, equals))
                    .filter((room: Object) => room.id !== currentRoomId)
                    .sort((p1: Object, p2: Object) => (p1?.name || '').localeCompare(p2?.name || ''));
    const inBreakoutRoom = useSelector(isInBreakoutRoom);
    const isLocalModerator = useSelector(isLocalParticipantModerator);
    const participantsCount = useSelector(getParticipantCount);
    const { hideJoinRoomButton } = useSelector(getBreakoutRoomsConfig);
    const _overflowDrawer = useSelector(showOverflowDrawer);
    const [ lowerMenu, raiseMenu, toggleMenu, menuEnter, menuLeave, raiseContext ] = useContextMenu();

    const onRaiseMenu = useCallback(room => target => raiseMenu(room, target), [ raiseMenu ]);

    return (
        <>
            {inBreakoutRoom && <LeaveButton />}
            {!inBreakoutRoom
                && isLocalModerator
                && participantsCount > 2
                && rooms.length > 1
                && <AutoAssignButton />}
            <div id = 'breakout-rooms-list'>
                {rooms.map((room: Object) => (
                    <React.Fragment key = { room.id }>
                        <CollapsibleRoom
                            isHighlighted = { raiseContext.entity === room }
                            onLeave = { lowerMenu }
                            onRaiseMenu = { onRaiseMenu(room) }
                            room = { room }
                            searchString = { searchString }>
                            {!_overflowDrawer && <>
                                {!hideJoinRoomButton && <JoinActionButton room = { room } />}
                                {isLocalModerator && !room.isMainRoom
                                    && <RoomActionEllipsis onClick = { toggleMenu(room) } />}
                            </>}
                        </CollapsibleRoom>
                    </React.Fragment>
                ))}
            </div>
            <RoomContextMenu
                onEnter = { menuEnter }
                onLeave = { menuLeave }
                onSelect = { lowerMenu }
                { ...raiseContext } />
        </>
    );
};
