// @flow

import { makeStyles } from '@material-ui/styles';
import clsx from 'clsx';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { ListItem } from '../../../../../base/components';
import { Icon, IconArrowDown, IconArrowUp } from '../../../../../base/icons';
import { isLocalParticipantModerator } from '../../../../../base/participants';
import { showOverflowDrawer } from '../../../../../toolbox/functions.web';
import { ACTION_TRIGGER } from '../../../../constants';
import { participantMatchesSearch } from '../../../../functions';
import ParticipantActionEllipsis from '../../../web/ParticipantActionEllipsis';
import ParticipantItem from '../../../web/ParticipantItem';

type Props = {

    /**
     * Type of trigger for the breakout room actions.
     */
    actionsTrigger?: string,

    /**
     * React children.
     */
    children: React$Node,

    /**
     * Is this item highlighted/raised.
     */
    isHighlighted?: boolean,

    /**
     * Callback to raise menu. Used to raise menu on mobile long press.
     */
    onRaiseMenu: Function,

    /**
     * Callback for when the mouse leaves this component.
     */
    onLeave?: Function,

    /**
     * The raise context for the participant menu.
     */
    participantContextEntity: ?Object,

    /**
     * Callback to raise participant context menu.
     */
    raiseParticipantContextMenu: Function,

    /**
     * Room reference.
     */
    room: Object,

    /**
     * Participants search string.
     */
    searchString: string,

    /**
     * Toggles the room participant context menu.
     */
    toggleParticipantMenu: Function
}

const useStyles = makeStyles(theme => {
    return {
        container: {
            boxShadow: 'none'
        },

        roomName: {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            ...theme.typography.labelButton,
            lineHeight: `${theme.typography.labelButton.lineHeight}px`,
            padding: '12px 0'
        },

        arrowContainer: {
            backgroundColor: theme.palette.ui03,
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            marginRight: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }
    };
});

export const CollapsibleRoom = ({
    actionsTrigger = ACTION_TRIGGER.HOVER,
    children,
    isHighlighted,
    onRaiseMenu,
    onLeave,
    participantContextEntity,
    raiseParticipantContextMenu,
    room,
    searchString,
    toggleParticipantMenu
}: Props) => {
    const { t } = useTranslation();
    const styles = useStyles();
    const [ collapsed, setCollapsed ] = useState(false);
    const toggleCollapsed = useCallback(() => {
        setCollapsed(!collapsed);
    }, [ collapsed ]);
    const raiseMenu = useCallback(target => {
        onRaiseMenu(target);
    }, [ onRaiseMenu ]);
    const { defaultRemoteDisplayName } = useSelector(state => state['features/base/config']);
    const overflowDrawer = useSelector(showOverflowDrawer);
    const moderator = useSelector(isLocalParticipantModerator);

    const arrow = (<div className = { styles.arrowContainer }>
        <Icon
            size = { 14 }
            src = { collapsed ? IconArrowDown : IconArrowUp } />
    </div>);

    const roomName = (<span className = { styles.roomName }>
        {`${room.name || t('breakoutRooms.mainRoom')} (${Object.keys(room?.participants
            || {}).length})`}
    </span>);

    const raiseParticipantMenu = useCallback(({ participantID, displayName }) => moderator
    && raiseParticipantContextMenu({
        room,
        jid: participantID,
        participantName: displayName
    }), [ room, moderator ]);

    return (
        <>
            <ListItem
                actions = { children }
                className = { clsx(styles.container, 'breakout-room-container') }
                icon = { arrow }
                isHighlighted = { isHighlighted }
                onClick = { toggleCollapsed }
                onLongPress = { raiseMenu }
                onMouseLeave = { onLeave }
                testId = { room.id }
                textChildren = { roomName }
                trigger = { actionsTrigger } />
            {!collapsed && room?.participants
                && Object.values(room?.participants || {}).map((p: Object) =>
                    participantMatchesSearch(p, searchString) && (
                        <ParticipantItem
                            actionsTrigger = { ACTION_TRIGGER.HOVER }
                            displayName = { p.displayName || defaultRemoteDisplayName }
                            isHighlighted = { participantContextEntity?.jid === p.jid }
                            key = { p.jid }
                            local = { false }
                            openDrawerForParticipant = { raiseParticipantMenu }
                            overflowDrawer = { overflowDrawer }
                            participantID = { p.jid }>
                            {!overflowDrawer && moderator && (
                                <ParticipantActionEllipsis
                                    onClick = { toggleParticipantMenu({ room,
                                        jid: p.jid,
                                        participantName: p.displayName }) } />
                            )}
                        </ParticipantItem>
                    ))
            }
        </>
    );
};
