// @flow

import React from 'react';

import { ActionTrigger } from '../constants';

import { Room } from './Room';
import { RoomActionEllipsis } from './styled';

type Props = {

    /**
     * Is this item highlighted
     */
    isHighlighted: boolean,

    /**
     * Callback for the activation of this item's context menu
     */
    onContextMenu: Function,

    /**
     * Callback for the mouse leaving this item
     */
    onLeave: Function,

    /**
     * Room reference
     */
    room: Object
};

export const RoomItem = ({
    isHighlighted,
    onContextMenu,
    onLeave,
    room
}: Props) => (
        <>
            <Room
                actionsTrigger = { ActionTrigger.Hover }
                isHighlighted = { isHighlighted }
                onLeave = { onLeave }
                room = { room }>
                <RoomActionEllipsis onClick = { onContextMenu } />
            </Room>
        </>
);
