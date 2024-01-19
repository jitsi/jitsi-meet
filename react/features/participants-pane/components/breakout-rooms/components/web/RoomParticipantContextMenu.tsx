import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import Avatar from '../../../../../base/avatar/components/Avatar';
import {
    getButtonNotifyMode,
    getParticipantMenuButtonsWithNotifyClick
} from '../../../../../base/config/functions.web';
import { isLocalParticipantModerator } from '../../../../../base/participants/functions';
import ContextMenu from '../../../../../base/ui/components/web/ContextMenu';
import ContextMenuItemGroup from '../../../../../base/ui/components/web/ContextMenuItemGroup';
import { getBreakoutRooms } from '../../../../../breakout-rooms/functions';
import { NOTIFY_CLICK_MODE } from '../../../../../toolbox/constants';
import { showOverflowDrawer } from '../../../../../toolbox/functions.web';
import SendToRoomButton from '../../../../../video-menu/components/web/SendToRoomButton';
import { PARTICIPANT_MENU_BUTTONS as BUTTONS } from '../../../../../video-menu/constants';
import { AVATAR_SIZE } from '../../../../constants';


interface IProps {

    /**
     * Room and participant jid reference.
     */
    entity?: {
        jid: string;
        participantName: string;
        room: any;
    };

    /**
     * Target elements against which positioning calculations are made.
     */
    offsetTarget?: HTMLElement | null;

    /**
     * Callback for the mouse entering the component.
     */
    onEnter: () => void;

    /**
     * Callback for the mouse leaving the component.
     */
    onLeave: () => void;

    /**
     * Callback for making a selection in the menu.
     */
    onSelect: (force?: any) => void;
}

const useStyles = makeStyles()(theme => {
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
}: IProps) => {
    const { classes: styles } = useStyles();
    const { t } = useTranslation();
    const isLocalModerator = useSelector(isLocalParticipantModerator);
    const lowerMenu = useCallback(() => onSelect(true), [ onSelect ]);
    const rooms: Object = useSelector(getBreakoutRooms);
    const overflowDrawer = useSelector(showOverflowDrawer);
    const buttonsWithNotifyClick = useSelector(getParticipantMenuButtonsWithNotifyClick);

    const notifyClick = useCallback(
        (buttonKey: string, participantId?: string) => {
            const notifyMode = getButtonNotifyMode(buttonKey, buttonsWithNotifyClick);

            if (!notifyMode) {
                return;
            }

            APP.API.notifyParticipantMenuButtonClicked(
                buttonKey,
                participantId,
                notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY
            );
        }, [ buttonsWithNotifyClick, getButtonNotifyMode ]);

    const breakoutRoomsButtons = useMemo(() => Object.values(rooms || {}).map((room: any) => {
        if (room.id !== entity?.room?.id) {
            return (<SendToRoomButton
                key = { room.id }
                // eslint-disable-next-line react/jsx-no-bind
                notifyClick = { () => notifyClick(BUTTONS.SEND_PARTICIPANT_TO_ROOM, entity?.jid) }
                notifyMode = { getButtonNotifyMode(BUTTONS.SEND_PARTICIPANT_TO_ROOM, buttonsWithNotifyClick) }
                onClick = { lowerMenu }
                participantID = { entity?.jid ?? '' }
                room = { room } />);
        }

        return null;
    })
    .filter(Boolean), [ entity, rooms ]);

    return isLocalModerator ? (
        <ContextMenu
            entity = { entity }
            isDrawerOpen = { Boolean(entity) }
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
                        size = { AVATAR_SIZE } />,
                    text: entity?.participantName
                } ] } />}

            <ContextMenuItemGroup>
                <div className = { styles.text }>
                    {t('breakoutRooms.actions.sendToBreakoutRoom')}
                </div>
                {breakoutRoomsButtons}
            </ContextMenuItemGroup>
        </ContextMenu>
    ) : null;
};
