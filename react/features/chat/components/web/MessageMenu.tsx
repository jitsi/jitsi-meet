import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { IconDotsHorizontal } from '../../../base/icons/svg';
import { getParticipantById, isLocalParticipantModerator } from '../../../base/participants/functions';
import Popover from '../../../base/popover/components/Popover.web';
import Button from '../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.any';
import { copyText } from '../../../base/util/copyText.web';
import { sendMessageModeration, sendMessageRetraction } from '../../actions.any';
import { handleLobbyChatInitialized, openChat } from '../../actions.web';
import { MESSAGE_TYPE_LOCAL } from '../../constants';
import logger from '../../logger';
import { IMessage } from '../../types';

export interface IProps {
    canEdit?: boolean;
    className?: string;
    displayName?: string;
    enablePrivateChat: boolean;
    isFileMessage?: boolean;
    isFromVisitor?: boolean;
    isLobbyMessage: boolean;
    isModerated?: boolean;
    message: IMessage;
    onEditMessage?: () => void;
    onPopoverOpenChange?: (isOpen: boolean) => void;
    participantId: string;
    tabIndex?: number;
}

const useStyles = makeStyles()(theme => {
    return {
        messageMenuButton: {
            padding: '2px'
        },
        menuItem: {
            padding: '8px 16px',
            cursor: 'pointer',
            color: 'white',
            outline: 'none',

            '&:hover, &:focus, &.focus-visible': {
                backgroundColor: theme.palette.action03
            }
        },
        menuPanel: {
            backgroundColor: theme.palette.chatInputBackground,
            borderRadius: theme.shape.borderRadius,
            boxShadow: theme.shadows[3],
            overflow: 'hidden'
        },
        copiedMessage: {
            position: 'fixed',
            backgroundColor: theme.palette.chatInputBackground,
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            zIndex: 1000,
            opacity: 0,
            transition: 'opacity 0.3s ease-in-out',
            pointerEvents: 'none'
        },
        showCopiedMessage: {
            opacity: 1
        }
    };
});

const MessageMenu = ({
    canEdit,
    displayName,
    enablePrivateChat,
    isFileMessage,
    isFromVisitor,
    isLobbyMessage,
    isModerated,
    message,
    onEditMessage,
    onPopoverOpenChange,
    tabIndex = -1
}: IProps) => {
    const dispatch = useDispatch();
    const { classes, cx } = useStyles();
    const { t } = useTranslation();
    const [ isPopoverOpen, setIsPopoverOpen ] = useState(false);
    const [ showCopiedMessage, setShowCopiedMessage ] = useState(false);
    const [ popupPosition, setPopupPosition ] = useState({ top: 0,
        left: 0 });
    const buttonRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const isModerator = useSelector(isLocalParticipantModerator);
    const messageModerationSupported = useSelector(
        (state: IReduxState) => state['features/chat'].messageModerationSupported);
    const participant = useSelector((state: IReduxState) => getParticipantById(state, message.participantId));

    // Editing and deleting are applied by the server, so only offer them where the
    // room says it handles them.
    const canEditMessage = canEdit && messageModerationSupported;

    const popoverId = useRef(`menu-${message.messageId}`);

    useEffect(() => {
        if (isPopoverOpen) {
            requestAnimationFrame(() => {
                const firstItem = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]');

                firstItem?.focus();
            });
        }
    }, [ isPopoverOpen ]);

    const handleClose = useCallback((restoreFocus = false) => {
        setIsPopoverOpen(false);
        onPopoverOpenChange?.(false);
        if (restoreFocus) {
            buttonRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
        }
    }, [ onPopoverOpenChange ]);

    const handleOpen = useCallback(() => {
        document.dispatchEvent(new CustomEvent('chat-popover-open', { detail: popoverId.current }));
        setIsPopoverOpen(true);
        onPopoverOpenChange?.(true);
    }, [ onPopoverOpenChange ]);

    useEffect(() => {
        const handleOtherOpen = (event: Event) => {
            const customEvent = event as CustomEvent<string>;

            if (customEvent.detail !== popoverId.current && isPopoverOpen) {
                handleClose();
            }
        };

        document.addEventListener('chat-popover-open', handleOtherOpen);

        return () => {
            document.removeEventListener('chat-popover-open', handleOtherOpen);
        };
    }, [ isPopoverOpen, handleClose ]);

    const handleToggle = useCallback(() => {
        if (isPopoverOpen) {
            handleClose(true);
        } else {
            handleOpen();
        }
    }, [ isPopoverOpen, handleClose, handleOpen ]);

    const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
        event.stopPropagation();
    }, []);

    const handleMenuKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            handleClose(true);

            return;
        }

        const items = Array.from(
            menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') || []
        );

        if (!items.length) {
            return;
        }

        const currentIndex = items.indexOf(document.activeElement as HTMLElement);

        if (event.key === 'Tab') {
            event.preventDefault();
            event.stopPropagation();

            if (event.shiftKey) {
                const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;

                items[prevIndex]?.focus();
            } else {
                const nextIndex = currentIndex >= items.length - 1 || currentIndex === -1
                    ? 0
                    : currentIndex + 1;

                items[nextIndex]?.focus();
            }
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            event.stopPropagation();
            const nextIndex = currentIndex >= items.length - 1 || currentIndex === -1
                ? 0
                : currentIndex + 1;

            items[nextIndex]?.focus();
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            event.stopPropagation();
            const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;

            items[prevIndex]?.focus();
        }
    }, [ handleClose ]);

    const handleItemKeyDown = useCallback((action: () => void) => (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            action();
        }
    }, []);

    const handlePrivateClick = useCallback(() => {
        if (isLobbyMessage) {
            dispatch(handleLobbyChatInitialized(message.participantId));
        } else {
            // For visitor messages, participant will be undefined but we can still open chat
            // using the participantId which contains the visitor's original JID
            if (isFromVisitor) {
                // Handle visitor participant that doesn't exist in main participant list
                const visitorParticipant = {
                    id: message.participantId,
                    name: displayName,
                    isVisitor: true
                };

                dispatch(openChat(visitorParticipant));
            } else {
                dispatch(openChat(participant));
            }
        }
        handleClose();
    }, [ dispatch, isLobbyMessage, participant, message.participantId, displayName, isFromVisitor, handleClose ]);

    const handleCopyClick = useCallback(() => {
        copyText(message.message)
            .then(success => {
                if (success) {
                    if (buttonRef.current) {
                        const rect = buttonRef.current.getBoundingClientRect();

                        setPopupPosition({
                            top: rect.top - 30,
                            left: rect.left
                        });
                    }
                    setShowCopiedMessage(true);
                    setTimeout(() => {
                        setShowCopiedMessage(false);
                    }, 2000);
                } else {
                    logger.error('Failed to copy text');
                }
            })
            .catch((error: Error) => {
                logger.error('Error copying text', error);
            });
        handleClose();
    }, [ message.message, handleClose ]);

    const handleDeleteClick = useCallback(() => {
        dispatch(sendMessageRetraction(message));

        handleClose();
    }, [ message, handleClose, dispatch ]);

    const handleModerateClick = useCallback(() => {
        dispatch(sendMessageModeration(message));
        handleClose();
    }, [ dispatch, message, handleClose ]);

    const handleEditClick = useCallback(() => {
        onEditMessage?.();
        handleClose();
    }, [ onEditMessage, handleClose ]);

    if (!enablePrivateChat && isFileMessage && !canEditMessage) {
        return null;
    }

    const popoverContent = (
        <div
            className = { classes.menuPanel }
            onKeyDown = { handleMenuKeyDown }
            ref = { menuRef }
            role = 'menu'>
            {canEditMessage && (
                <div
                    aria-label = { t('chat.edit') }
                    className = { classes.menuItem }
                    onClick = { handleEditClick }
                    onKeyDown = { handleItemKeyDown(handleEditClick) }
                    role = 'menuitem'
                    tabIndex = { 0 }>
                    {t('chat.edit')}
                </div>
            )}
            {enablePrivateChat && (
                <div
                    aria-label = { t('chat.privateMessage') }
                    className = { classes.menuItem }
                    onClick = { handlePrivateClick }
                    onKeyDown = { handleItemKeyDown(handlePrivateClick) }
                    role = 'menuitem'
                    tabIndex = { 0 }>
                    {t('chat.privateMessage')}
                </div>
            )}
            {!isFileMessage && (
                <div
                    aria-label = { t('chat.copy') }
                    className = { classes.menuItem }
                    onClick = { handleCopyClick }
                    onKeyDown = { handleItemKeyDown(handleCopyClick) }
                    role = 'menuitem'
                    tabIndex = { 0 }>
                    {t('chat.copy')}
                </div>
            )}
            {isModerator
                && !isModerated
                && messageModerationSupported
                && message.messageType !== MESSAGE_TYPE_LOCAL
                && (
                    <div
                        aria-label = { t('chat.delete') }
                        className = { classes.menuItem }
                        onClick = { handleModerateClick }
                        onKeyDown = { handleItemKeyDown(handleModerateClick) }
                        role = 'menuitem'
                        tabIndex = { 0 }>
                        {t('chat.delete')}
                    </div>
                )}
            {message.messageType === MESSAGE_TYPE_LOCAL
                && !message.isDeleted
                && !message.isModerated
                && messageModerationSupported
                && (
                    <div
                        aria-label = { t('chat.deleteMessage') }
                        className = { classes.menuItem }
                        onClick = { handleDeleteClick }
                        onKeyDown = { handleItemKeyDown(handleDeleteClick) }
                        role = 'menuitem'
                        tabIndex = { 0 }>
                        {t('chat.deleteMessage')}
                    </div>
                )}
        </div>
    );

    return (
        <div>
            <div ref = { buttonRef }>
                <Popover
                    allowClick = { true }
                    content = { popoverContent }
                    onPopoverClose = { handleClose }
                    position = 'top'
                    trigger = 'click'
                    visible = { isPopoverOpen }>
                    <Button
                        accessibilityLabel = { t('toolbar.accessibilityLabel.moreOptions') }
                        className = { classes.messageMenuButton }
                        icon = { IconDotsHorizontal }
                        onClick = { handleToggle }
                        onKeyPress = { handleKeyPress }
                        tabIndex = { tabIndex }
                        type = { BUTTON_TYPES.TERTIARY } />
                </Popover>
            </div>

            {showCopiedMessage && ReactDOM.createPortal(
                <div
                    className = { cx(classes.copiedMessage, { [classes.showCopiedMessage]: showCopiedMessage }) }
                    style = {{ top: `${popupPosition.top}px`,
                        left: `${popupPosition.left}px` }}>
                    {t('chat.messageCopied')}
                </div>,
                document.body
            )}
        </div>
    );
};

export default MessageMenu;
