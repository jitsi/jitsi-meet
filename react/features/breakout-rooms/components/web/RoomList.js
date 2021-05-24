// @flow

import React, { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { ThemeProvider } from 'styled-components';

import { getParticipants, isLocalParticipantModerator } from '../../../base/participants';
import { equals } from '../../../base/redux';
import { ParticipantItem } from '../../../participants-pane/components/ParticipantItem';
import { getRooms, isInBreakoutRoom, getCurrentRoomId } from '../../functions';

import { AutoAssignButton } from './AutoAssignButton';
import { LeaveButton } from './LeaveButton';
import { RoomContextMenu } from './RoomContextMenu';
import { RoomItem } from './RoomItem';
import { findStyledAncestor } from './functions';
import { RoomContainer } from './styled';
import theme from './theme.json';

type NullProto = {
  [key: string]: any,
  __proto__: null
};

type RaiseContext = NullProto | {

  /**
   * Target elements against which positioning calculations are made
   */
  offsetTarget?: HTMLElement,

  /**
   * Room reference
   */
  room?: Object,
};

const initialState = Object.freeze(Object.create(null));

export const RoomList = () => {
    const isMouseOverMenu = useRef(false);
    const currentRoomId = useSelector(getCurrentRoomId);
    // eslint-disable-next-line no-unused-vars
    const { [currentRoomId]: _currentRoom, ...rooms } = useSelector(getRooms, equals);
    const [ raiseContext, setRaiseContext ] = useState<RaiseContext>(initialState);
    const inBreakoutRoom = useSelector(isInBreakoutRoom);
    const isLocalModerator = useSelector(isLocalParticipantModerator);
    const participantsCount = useSelector(getParticipants).length;

    const lowerMenu = useCallback(() => {
        /**
         * We are tracking mouse movement over the active room item and
         * the context menu. Due to the order of enter/leave events, we need to
         * defer checking if the mouse is over the context menu with
         * queueMicrotask
         */
        window.queueMicrotask(() => {
            if (isMouseOverMenu.current) {
                return;
            }

            if (raiseContext !== initialState) {
                setRaiseContext(initialState);
            }
        });
    }, [ raiseContext ]);

    const raiseMenu = useCallback((room, target) => {
        setRaiseContext({
            room,
            offsetTarget: findStyledAncestor(target, RoomContainer)
        });
    }, [ raiseContext ]);

    const toggleMenu = useCallback(room => e => {
        const { room: raisedRoom } = raiseContext;

        if (raisedRoom && raisedRoom === room) {
            lowerMenu();
        } else {
            raiseMenu(room, e.target);
        }
    }, [ raiseContext ]);

    const menuEnter = useCallback(() => {
        isMouseOverMenu.current = true;
    }, []);

    const menuLeave = useCallback(() => {
        isMouseOverMenu.current = false;
        lowerMenu();
    }, [ lowerMenu ]);

    return (
        <ThemeProvider theme = { theme }>
        <>
            {inBreakoutRoom && <LeaveButton />}
            {!inBreakoutRoom
                && isLocalModerator
                && participantsCount > 2
                && Object.keys(rooms).length > 1
                && <AutoAssignButton />}
            <div>
                {Object.values(rooms).map((room: Object) => (
                    <div key = { room.id }>
                        <RoomItem
                            isHighlighted = { raiseContext.room === room }
                            onContextMenu = { toggleMenu(room) }
                            onLeave = { lowerMenu }
                            room = { room } />
                        {(room.participants || []).map(p => (
                            <ParticipantItem
                                children = { null }
                                key = { p.id }
                                name = { p.displayName }
                                participant = { p } />
                        ))}
                    </div>
                ))}
            </div>
            <RoomContextMenu
                onEnter = { menuEnter }
                onLeave = { menuLeave }
                onSelect = { lowerMenu }
                { ...raiseContext } />
        </>
        </ThemeProvider>
    );
};
