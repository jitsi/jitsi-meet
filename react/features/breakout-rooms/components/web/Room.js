// @flow

import React, { type Node } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { equals } from '../../../base/redux';
import { ActionTrigger } from '../../constants';
import { getRoomParticipants } from '../../functions';

import {
    Heading,
    RoomActionsHover,
    RoomActionsPermanent,
    RoomContainer
} from './styled';

/**
 * Breakout Room actions component mapping depending on trigger type.
 */
const Actions = {
    [ActionTrigger.Hover]: RoomActionsHover,
    [ActionTrigger.Permanent]: RoomActionsPermanent
};

type Props = {

    /**
     * Type of trigger for the breakout room actions
     */
    actionsTrigger: string,

    /**
     * React children
     */
    children: Node,

    /**
     * Is this item highlighted/raised
     */
    isHighlighted?: boolean,

    /**
     * Callback for when the mouse leaves this component
     */
    onLeave?: Function,

    /**
     * Room reference
     */
    room: Object,
}

export const Room = ({
    children,
    isHighlighted,
    onLeave,
    actionsTrigger = ActionTrigger.Hover,
    room
}: Props) => {
    const RoomActions = Actions[actionsTrigger];
    const participants = useSelector(state => getRoomParticipants(state, room.id), equals);
    const { t } = useTranslation();

    return (
        <RoomContainer
            isHighlighted = { isHighlighted }
            onMouseLeave = { onLeave }
            trigger = { actionsTrigger }>
            <Heading>
                { room.name || t('breakoutRooms.mainRoom') }
                { participants.length > 0 && ` (${participants.length})` }
            </Heading>
            <RoomActions children = { children } />
        </RoomContainer>
    );
};
