// @flow

import { makeStyles } from '@material-ui/core';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { Avatar } from '../../../../../base/avatar';
import { ContextMenu, ContextMenuItemGroup } from '../../../../../base/components';
import { isLocalParticipantModerator } from '../../../../../base/participants';
import { getBreakoutRooms } from '../../../../../breakout-rooms/functions';
import { showOverflowDrawer } from '../../../../../toolbox/functions.web';
import SendToRoomButton from '../../../../../video-menu/components/web/SendToRoomButton';

type Props = {

    /**
     * Room and participant jid reference.
     */
    entity: Object,

    /**
     * Target elements against which positioning calculations are made.
     */
    offsetTarget: ?HTMLElement,

    /**
     * Callback for the mouse entering the component.
     */
    onEnter: Function,

    /**
     * Callback for the mouse leaving the component.
     */
    onLeave: Function,

    /**
     * Callback for making a selection in the menu.
     */
    onSelect: Function
};

const useStyles = makeStyles(theme => {
    return {
        text: {
            color: theme.palette.text02,
            padding: '10px 16px',
            height: '40px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            boxSizing: 'border-box'
        }
    };
});

export const RoomParticipantContextMenu = ({
    entity,
    offsetTarget,
    onEnter,
    onLeave,
    onSelect
}: Props) => {
    const styles = useStyles();
    const { t } = useTranslation();
    const isLocalModerator = useSelector(isLocalParticipantModerator);
    const lowerMenu = useCallback(() => onSelect(true));
    const rooms = useSelector(getBreakoutRooms);
    const overflowDrawer = useSelector(showOverflowDrawer);

    const breakoutRoomsButtons = useMemo(() => Object.values(rooms || {}).map((room: Object) => {
        if (room.id !== entity?.room?.id) {
            return (<SendToRoomButton
                key = { room.id }
                onClick = { lowerMenu }
                participantJid = { entity?.jid }
                room = { room } />);
        }

        return null;
    })
    .filter(Boolean), [ entity, rooms ]);

    return isLocalModerator && (
        <ContextMenu
            entity = { entity }
            isDrawerOpen = { entity }
            offsetTarget = { offsetTarget }
            onClick = { lowerMenu }
            onDrawerClose = { onSelect }
            onMouseEnter = { onEnter }
            onMouseLeave = { onLeave }>
            {overflowDrawer && entity?.jid && <ContextMenuItemGroup
                actions = { [ {
                    accessibilityLabel: entity?.participantName,
                    customIcon: <Avatar
                        displayName = { entity?.participantName }
                        size = { 20 } />,
                    text: entity?.participantName
                } ] } />}
            <ContextMenuItemGroup>
                <div className = { styles.text }>
                    {t('breakoutRooms.actions.sendToBreakoutRoom')}
                </div>
                {breakoutRoomsButtons}
            </ContextMenuItemGroup>
        </ContextMenu>
    );
};
