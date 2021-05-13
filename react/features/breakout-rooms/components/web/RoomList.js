// @flow

import React, { useCallback, useRef, useState } from 'react';
import { useSelector, useStore } from 'react-redux';
import { ThemeProvider } from 'styled-components';

import { selectBreakoutRooms, getIsInBreakoutRoom } from '../../functions';

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
    const store = useStore();
    const state = store.getState();
    const breakoutRooms = useSelector(selectBreakoutRooms);
    const isInBreakoutRoom = getIsInBreakoutRoom(state);
    const [ raiseContext, setRaiseContext ] = useState<RaiseContext>(initialState);

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
            {isInBreakoutRoom && <LeaveButton />}
            <div>
                {breakoutRooms.map(room => (
                    <RoomItem
                        isHighlighted = { raiseContext.room === room }
                        key = { room.id }
                        onContextMenu = { toggleMenu(room) }
                        onLeave = { lowerMenu }
                        room = { room } />
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
