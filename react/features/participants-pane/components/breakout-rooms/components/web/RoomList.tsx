import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { isMobileBrowser } from '../../../../../base/environment/utils';
import { isLocalParticipantModerator } from '../../../../../base/participants/functions';
import { equals } from '../../../../../base/redux/functions';
import useContextMenu from '../../../../../base/ui/hooks/useContextMenu.web';
import {
    getBreakoutRooms,
    getBreakoutRoomsConfig,
    getCurrentRoomId,
    isAutoAssignParticipantsVisible,
    isInBreakoutRoom
} from '../../../../../breakout-rooms/functions';
import { IRoom } from '../../../../../breakout-rooms/types';
import { showOverflowDrawer } from '../../../../../toolbox/functions.web';

import { AutoAssignButton } from './AutoAssignButton';
import { CollapsibleRoom } from './CollapsibleRoom';
import JoinActionButton from './JoinQuickActionButton';
import { LeaveButton } from './LeaveButton';
import RoomActionEllipsis from './RoomActionEllipsis';
import { RoomContextMenu } from './RoomContextMenu';
import { RoomParticipantContextMenu } from './RoomParticipantContextMenu';

interface IProps {

    /**
     * Participants search string.
     */
    searchString: string;
}

const useStyles = makeStyles()(theme => {
    return {
        topMargin: {
            marginTop: theme.spacing(3)
        }
    };
});

export const RoomList = ({ searchString }: IProps) => {
    const { classes } = useStyles();
    const currentRoomId = useSelector(getCurrentRoomId);
    const rooms = Object.values(useSelector(getBreakoutRooms, equals))
                    .filter((room: IRoom) => room.id !== currentRoomId)
                    .sort((p1?: IRoom, p2?: IRoom) => (p1?.name || '').localeCompare(p2?.name || ''));
    const inBreakoutRoom = useSelector(isInBreakoutRoom);
    const isLocalModerator = useSelector(isLocalParticipantModerator);
    const showAutoAssign = useSelector(isAutoAssignParticipantsVisible);
    const { hideJoinRoomButton } = useSelector(getBreakoutRoomsConfig);
    const overflowDrawer = useSelector(showOverflowDrawer);
    const [ lowerMenu, raiseMenu, toggleMenu, menuEnter, menuLeave, raiseContext ] = useContextMenu<IRoom>();
    const [ lowerParticipantMenu, raiseParticipantMenu, toggleParticipantMenu,
        participantMenuEnter, participantMenuLeave, raiseParticipantContext ] = useContextMenu<{
            jid: string;
            participantName: string;
            room: IRoom;
        }>();
    const hideMenu = useCallback(() => !overflowDrawer && lowerMenu(), [ overflowDrawer, lowerMenu ]);
    const onRaiseMenu = useCallback(room => (target: HTMLElement) => raiseMenu(room, target), [ raiseMenu ]);

    return (
        <>
            {inBreakoutRoom && <LeaveButton className = { classes.topMargin } />}
            {showAutoAssign && <AutoAssignButton className = { classes.topMargin } />}
            <div
                className = { classes.topMargin }
                id = 'breakout-rooms-list'>
                {rooms.map(room => (
                    <React.Fragment key = { room.id }>
                        <CollapsibleRoom
                            isHighlighted = { raiseContext.entity === room }
                            onLeave = { hideMenu }
                            onRaiseMenu = { onRaiseMenu(room) }
                            participantContextEntity = { raiseParticipantContext.entity }
                            raiseParticipantContextMenu = { raiseParticipantMenu }
                            room = { room }
                            searchString = { searchString }
                            toggleParticipantMenu = { toggleParticipantMenu }>
                            {!isMobileBrowser() && <>
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
            <RoomParticipantContextMenu
                onEnter = { participantMenuEnter }
                onLeave = { participantMenuLeave }
                onSelect = { lowerParticipantMenu }
                { ...raiseParticipantContext } />
        </>
    );
};
