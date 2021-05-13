// @flow

import React, { type Node } from 'react';
import { useTranslation } from 'react-i18next';

import { ActionTrigger } from '../../constants';

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
    const { t } = useTranslation();

    return (
        <RoomContainer
            isHighlighted = { isHighlighted }
            onMouseLeave = { onLeave }
            trigger = { actionsTrigger }>
            <Heading>
                {t('breakoutRooms.headings.breakoutRoom', { index: room.index })}
            </Heading>
            <RoomActions children = { children } />
        </RoomContainer>
    );
};
