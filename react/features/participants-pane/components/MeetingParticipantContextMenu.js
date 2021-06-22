// @flow

import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { isToolbarButtonEnabled } from '../../base/config/functions.web';
import { openDialog } from '../../base/dialog';
import {
    IconCloseCircle,
    IconCrown,
    IconMessage,
    IconMuteEveryoneElse,
    IconVideoOff
} from '../../base/icons';
import { isLocalParticipantModerator, isParticipantModerator } from '../../base/participants';
import { getIsParticipantVideoMuted } from '../../base/tracks';
import { openChat } from '../../chat/actions';
import { GrantModeratorDialog, KickRemoteParticipantDialog, MuteEveryoneDialog } from '../../video-menu';
import MuteRemoteParticipantsVideoDialog from '../../video-menu/components/web/MuteRemoteParticipantsVideoDialog';
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
     * Participant reference
     */
    participant: Object
};

export const MeetingParticipantContextMenu = ({
    offsetTarget,
    onEnter,
    onLeave,
    onSelect,
    participant
}: Props) => {
    const dispatch = useDispatch();
    const containerRef = useRef(null);
    const isLocalModerator = useSelector(isLocalParticipantModerator);
    const isChatButtonEnabled = useSelector(isToolbarButtonEnabled('chat'));
    const isParticipantVideoMuted = useSelector(getIsParticipantVideoMuted(participant));
    const [ isHidden, setIsHidden ] = useState(true);
    const { t } = useTranslation();

    useLayoutEffect(() => {
        if (participant
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
    }, [ participant, offsetTarget ]);

    const grantModerator = useCallback(() => {
        dispatch(openDialog(GrantModeratorDialog, {
            participantID: participant.id
        }));
    }, [ dispatch, participant ]);

    const kick = useCallback(() => {
        dispatch(openDialog(KickRemoteParticipantDialog, {
            participantID: participant.id
        }));
    }, [ dispatch, participant ]);

    const muteEveryoneElse = useCallback(() => {
        dispatch(openDialog(MuteEveryoneDialog, {
            exclude: [ participant.id ]
        }));
    }, [ dispatch, participant ]);

    const muteVideo = useCallback(() => {
        dispatch(openDialog(MuteRemoteParticipantsVideoDialog, {
            participantID: participant.id
        }));
    }, [ dispatch, participant ]);

    const sendPrivateMessage = useCallback(() => {
        dispatch(openChat(participant));
    }, [ dispatch, participant ]);

    if (!participant) {
        return null;
    }

    return (
        <ContextMenu
            className = { ignoredChildClassName }
            innerRef = { containerRef }
            isHidden = { isHidden }
            onClick = { onSelect }
            onMouseEnter = { onEnter }
            onMouseLeave = { onLeave }>
            <ContextMenuItemGroup>
                {isLocalModerator && (
                    <ContextMenuItem onClick = { muteEveryoneElse }>
                        <ContextMenuIcon src = { IconMuteEveryoneElse } />
                        <span>{t('toolbar.accessibilityLabel.muteEveryoneElse')}</span>
                    </ContextMenuItem>
                )}
                {isLocalModerator && (isParticipantVideoMuted || (
                    <ContextMenuItem onClick = { muteVideo }>
                        <ContextMenuIcon src = { IconVideoOff } />
                        <span>{t('participantsPane.actions.stopVideo')}</span>
                    </ContextMenuItem>
                ))}
            </ContextMenuItemGroup>
            <ContextMenuItemGroup>
                {isLocalModerator && !isParticipantModerator(participant) && (
                    <ContextMenuItem onClick = { grantModerator }>
                        <ContextMenuIcon src = { IconCrown } />
                        <span>{t('toolbar.accessibilityLabel.grantModerator')}</span>
                    </ContextMenuItem>
                )}
                {isLocalModerator && (
                    <ContextMenuItem onClick = { kick }>
                        <ContextMenuIcon src = { IconCloseCircle } />
                        <span>{t('videothumbnail.kick')}</span>
                    </ContextMenuItem>
                )}
                {isChatButtonEnabled && (
                    <ContextMenuItem onClick = { sendPrivateMessage }>
                        <ContextMenuIcon src = { IconMessage } />
                        <span>{t('toolbar.accessibilityLabel.privateMessage')}</span>
                    </ContextMenuItem>
                )}
            </ContextMenuItemGroup>
        </ContextMenu>
    );
};
