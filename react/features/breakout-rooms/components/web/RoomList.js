// @flow

import _ from 'lodash';
import React, { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { ThemeProvider } from 'styled-components';

import { getParticipantCount, isLocalParticipantModerator } from '../../../base/participants';
import { equals } from '../../../base/redux';
import ParticipantItem from '../../../participants-pane/components/ParticipantItem';
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
    const rooms = Object.values(useSelector(getRooms, equals))
                    .filter((room: Object) => room.id !== currentRoomId)
                    .sort((p1: Object, p2: Object) => (p1?.name || '').localeCompare(p2?.name || ''));
    const [ raiseContext, setRaiseContext ] = useState<RaiseContext>(initialState);
    const inBreakoutRoom = useSelector(isInBreakoutRoom);
    const isLocalModerator = useSelector(isLocalParticipantModerator);
    const participantsCount = useSelector(getParticipantCount);

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
                && rooms.length > 1
                && <AutoAssignButton />}
            <div>
                {rooms.map((room: Object) => (
                    <div key = { room.id }>
                        <RoomItem
                            isHighlighted = { raiseContext.room === room }
                            onContextMenu = { toggleMenu(room) }
                            onLeave = { lowerMenu }
                            room = { room } />
                        {_.map(room.participants || {}, p => (
                            <ParticipantItem
                                displayName = { p.displayName }
                                key = { p.jid }
                                local = { false } />
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
