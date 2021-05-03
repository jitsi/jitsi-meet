// @flow

import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import conference from '../../../../conference';
import {
    IconClose,
    IconMeetingUnlocked
} from '../../base/icons';
import { isLocalParticipantModerator } from '../../base/participants';
import { removeBreakoutRoom } from '../actions';
import { getComputedOuterHeight } from '../functions';

import {
    ContextMenu,
    ContextMenuIcon,
    ContextMenuItem,
    ContextMenuItemGroup,
    ignoredChildClassName
} from './styled';


type Props = {

    /**
     * Target elements against which positioning calculations are made
     */
    offsetTarget: HTMLElement,

    /**
     * Callback for the mouse entering the component
     */
    onEnter: Function,

    /**
     * Callback for the mouse leaving the component
     */
    onLeave: Function,

    /**
     * Callback for making a selection in the menu
     */
    onSelect: Function,

    /**
     * Room reference
     */
    room: Object
};

export const RoomContextMenu = ({
    offsetTarget,
    onEnter,
    onLeave,
    onSelect,
    room
}: Props) => {
    const containerRef = useRef(null);
    const dispatch = useDispatch();
    const isLocalModerator = useSelector(isLocalParticipantModerator);

    const [ isHidden, setIsHidden ] = useState(true);

    useLayoutEffect(() => {
        if (room
            && containerRef.current
            && offsetTarget?.offsetParent
            && offsetTarget.offsetParent instanceof HTMLElement
        ) {
            const { current: container } = containerRef;
            const { offsetTop, offsetParent: { offsetHeight, scrollTop } } = offsetTarget;
            const outerHeight = getComputedOuterHeight(container);

            container.style.top = offsetTop + outerHeight > offsetHeight + scrollTop
                ? offsetTop - outerHeight
                : offsetTop;

            setIsHidden(false);
        } else {
            setIsHidden(true);
        }
    }, [ room, offsetTarget ]);

    const onJoinRoom = useCallback(() => {
        conference.switchRoom(room.id);
    }, [ room ]);

    const onRemoveBreakoutRoom = useCallback(() => {
        dispatch(removeBreakoutRoom(room.id));
    }, [ dispatch, room ]);

    return (
        <ContextMenu
            className = { ignoredChildClassName }
            innerRef = { containerRef }
            isHidden = { isHidden }
            onClick = { onSelect }
            onMouseEnter = { onEnter }
            onMouseLeave = { onLeave }>
            <ContextMenuItemGroup>
                <ContextMenuItem onClick = { onJoinRoom }>
                    <ContextMenuIcon src = { IconMeetingUnlocked } />
                    <span>Join</span>
                </ContextMenuItem>
                {isLocalModerator
                    && <ContextMenuItem onClick = { onRemoveBreakoutRoom }>
                        <ContextMenuIcon src = { IconClose } />
                        <span>Remove</span>
                    </ContextMenuItem>
                }
            </ContextMenuItemGroup>
        </ContextMenu>
    );
};
