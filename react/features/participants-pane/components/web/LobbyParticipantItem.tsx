import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IconDotsHorizontal, IconMessage, IconUserDeleted } from '../../../base/icons/svg';
import { hasRaisedHand } from '../../../base/participants/functions';
import { IParticipant } from '../../../base/participants/types';
import Button from '../../../base/ui/components/web/Button';
import ContextMenu from '../../../base/ui/components/web/ContextMenu';
import ContextMenuItemGroup from '../../../base/ui/components/web/ContextMenuItemGroup';
import { BUTTON_TYPES } from '../../../base/ui/constants.web';
import { showLobbyChatButton } from '../../../lobby/functions';
import { ACTION_TRIGGER, MEDIA_STATE } from '../../constants';
import { useLobbyActions } from '../../hooks';

import ParticipantItem from './ParticipantItem';

interface IProps {

    /**
     * Callback used to open a drawer with admit/reject actions.
     */
    openDrawerForParticipant: Function;

    /**
     * If an overflow drawer should be displayed.
     */
    overflowDrawer: boolean;

    /**
     * Participant reference.
     */
    participant: IParticipant;
}

const useStyles = makeStyles()(theme => {
    return {
        button: {
            marginRight: theme.spacing(2)
        },
        moreButton: {
            paddingRight: '6px',
            paddingLeft: '6px',
            marginRight: theme.spacing(2)
        },
        contextMenu: {
            position: 'fixed',
            top: 'auto',
            marginRight: '8px'
        }
    };
});

export const LobbyParticipantItem = ({
    overflowDrawer,
    participant: p,
    openDrawerForParticipant
}: IProps) => {
    const { id } = p;
    const [ admit, reject, chat ] = useLobbyActions({ participantID: id });
    const { t } = useTranslation();
    const [ isOpen, setIsOpen ] = useState(false);
    const { classes: styles } = useStyles();

    const showChat = useSelector(showLobbyChatButton(p));

    const moreButtonRef = useRef();

    const openContextMenu = useCallback(() => setIsOpen(true), []);
    const closeContextMenu = useCallback(() => setIsOpen(false), []);

    const renderAdmitButton = () => (
        <Button
            accessibilityLabel = { `${t('lobby.admit')} ${p.name}` }
            className = { styles.button }
            labelKey = { 'lobby.admit' }
            onClick = { admit }
            size = 'small'
            testId = { `admit-${id}` } />);

    return (
        <ParticipantItem
            actionsTrigger = { ACTION_TRIGGER.PERMANENT }
            audioMediaState = { MEDIA_STATE.NONE }
            displayName = { p.name }
            local = { p.local }
            openDrawerForParticipant = { openDrawerForParticipant }
            overflowDrawer = { overflowDrawer }
            participantID = { id }
            raisedHand = { hasRaisedHand(p) }
            videoMediaState = { MEDIA_STATE.NONE }
            youText = { t('chat.you') }>

            {showChat ? <>
                {renderAdmitButton()}
                <Button
                    accessibilityLabel = { `${t('participantsPane.actions.moreModerationActions')} ${p.name}` }
                    className = { styles.moreButton }
                    icon = { IconDotsHorizontal }
                    onClick = { openContextMenu }
                    ref = { moreButtonRef }
                    size = 'small' />
                <ContextMenu
                    className = { styles.contextMenu }
                    hidden = { !isOpen }
                    offsetTarget = { moreButtonRef.current }
                    onMouseLeave = { closeContextMenu }>
                    <ContextMenuItemGroup
                        actions = { [ {
                            accessibilityLabel: `${t('lobby.chat')} ${p.name}`,
                            onClick: chat,
                            testId: `lobby-chat-${id}`,
                            icon: IconMessage,
                            text: t('lobby.chat')
                        } ] } />
                    <ContextMenuItemGroup
                        actions = { [ {
                            accessibilityLabel: `${t('lobby.reject')} ${p.name}`,
                            onClick: reject,
                            testId: `reject-${id}`,
                            icon: IconUserDeleted,
                            text: t('lobby.reject')
                        } ] } />
                </ContextMenu>
            </> : <>
                <Button
                    accessibilityLabel = { `${t('lobby.reject')} ${p.name}` }
                    className = { styles.button }
                    labelKey = { 'lobby.reject' }
                    onClick = { reject }
                    size = 'small'
                    testId = { `reject-${id}` }
                    type = { BUTTON_TYPES.DESTRUCTIVE } />
                {renderAdmitButton()}
            </>
            }
        </ParticipantItem>
    );
};
