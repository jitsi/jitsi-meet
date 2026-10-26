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
    participantId: string;
}

const useStyles = makeStyles()(theme => {
    return {
        messageMenuButton: {
            padding: '2px'
        },
        menuItem: {
            background: 'none',
            border: 0,
            color: 'white',
            cursor: 'pointer',
            font: 'inherit',
            padding: '8px 16px',
            textAlign: 'left',
            width: '100%',
            '&:hover': {
                backgroundColor: theme.palette.action03
            },
            '&:focus-visible': {
                outline: `2px solid ${theme.palette.focus01}`,
                outlineOffset: '-2px'
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

const MessageMenu = ({ canEdit, message, isFromVisitor, isLobbyMessage, isModerated, enablePrivateChat, displayName, isFileMessage, onEditMessage }: IProps) => {
    const dispatch = useDispatch();
    const { classes, cx } = useStyles();
    const { t } = useTranslation();
    const [ isPopoverOpen, setIsPopoverOpen ] = useState(false);
    const [ shouldFocusComposer, setShouldFocusComposer ] = useState(false);
    const [ showCopiedMessage, setShowCopiedMessage ] = useState(false);
    const [ popupPosition, setPopupPosition ] = useState({ top: 0,
        left: 0 });
    const buttonRef = useRef<HTMLDivElement>(null);
    const menuPanelRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const restoreTriggerFocus = useRef(false);

    const isModerator = useSelector(isLocalParticipantModerator);
    const messageModerationSupported = useSelector(
        (state: IReduxState) => state['features/chat'].messageModerationSupported);
    const participant = useSelector((state: IReduxState) => getParticipantById(state, message.participantId));

    // Editing and deleting are applied by the server, so only offer them where the
    // room says it handles them.
    const canEditMessage = canEdit && messageModerationSupported;

    useEffect(() => {
        if (!isPopoverOpen) {
            return undefined;
        }

        let frame = 0;
        const startedAt = performance.now();

        const focusFirstItem = () => {
            const panel = menuPanelRef.current;
            const firstItem = panel?.querySelector<HTMLButtonElement>('[role="menuitem"]');
            const active = document.activeElement;
            const itemHasFocus = Boolean(active instanceof HTMLElement
                && panel?.contains(active)
                && active.getAttribute('role') === 'menuitem');

            if (firstItem && !itemHasFocus && firstItem.getClientRects().length > 0) {
                firstItem.focus();
            }

            if (performance.now() - startedAt < 300) {
                frame = requestAnimationFrame(focusFirstItem);
            }
        };

        frame = requestAnimationFrame(focusFirstItem);

        return () => cancelAnimationFrame(frame);
    }, [ isPopoverOpen ]);

    useEffect(() => {
        if (!shouldFocusComposer) {
            return undefined;
        }

        const frame = requestAnimationFrame(() => {
            document.getElementById('chat-input-messagebox')?.focus();
            setShouldFocusComposer(false);
        });

        return () => cancelAnimationFrame(frame);
    }, [ shouldFocusComposer ]);

    useEffect(() => {
        if (isPopoverOpen || !restoreTriggerFocus.current) {
            return undefined;
        }

        restoreTriggerFocus.current = false;

        if (shouldFocusComposer) {
            return undefined;
        }

        const frame = requestAnimationFrame(() => {
            triggerRef.current?.focus();
        });

        return () => cancelAnimationFrame(frame);
    }, [ isPopoverOpen, shouldFocusComposer ]);

    // If no menu items will be shown, don't render the menu button.
    if (!enablePrivateChat && isFileMessage && !canEditMessage) {
        return null;
    }

    const handleMenuClick = useCallback(() => {
        restoreTriggerFocus.current = true;
        setIsPopoverOpen(true);
    }, []);

    const handleTriggerKeyPress = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === 'Enter') {
            event.stopPropagation();
        }
    }, []);

    const handleClose = useCallback(() => {
        setIsPopoverOpen(false);
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
        setShouldFocusComposer(true);
        handleClose();
    }, [ dispatch, isLobbyMessage, participant, message.participantId, displayName ]);

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
    }, [ message.message ]);

    const handleDeleteClick = useCallback(() => {
        dispatch(sendMessageRetraction(message));

        handleClose();
    }, [ message, handleClose ]);

    const handleModerateClick = useCallback(() => {
        dispatch(sendMessageModeration(message));
        handleClose();
    }, [ dispatch, message, handleClose ]);

    const handleEditClick = useCallback(() => {
        onEditMessage?.();
        setShouldFocusComposer(true);
        handleClose();
    }, [ onEditMessage, handleClose ]);

    const handleMenuKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter') {
            const item = (event.target as HTMLElement).closest('button');

            if (item instanceof HTMLButtonElement && event.currentTarget.contains(item)) {
                event.preventDefault();
                event.stopPropagation();
                item.click();
            }

            return;
        }

        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
            return;
        }

        const items = Array.from(
            menuPanelRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []
        );

        if (items.length === 0) {
            return;
        }

        event.preventDefault();

        const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
        const delta = event.key === 'ArrowDown' ? 1 : -1;
        const nextIndex = currentIndex === -1
            ? 0
            : (currentIndex + delta + items.length) % items.length;

        items[nextIndex]?.focus();
    }, []);

    const popoverContent = (
        <div
            className = { classes.menuPanel }
            onKeyDown = { handleMenuKeyDown }
            ref = { menuPanelRef }
            role = 'menu'>
            {canEditMessage && (
                <button
                    className = { classes.menuItem }
                    onClick = { handleEditClick }
                    role = 'menuitem'
                    type = 'button'>
                    {t('chat.edit')}
                </button>
            )}
            {enablePrivateChat && (
                <button
                    className = { classes.menuItem }
                    onClick = { handlePrivateClick }
                    role = 'menuitem'
                    type = 'button'>
                    {t('chat.privateMessage')}
                </button>
            )}
            {!isFileMessage && (
                <button
                    className = { classes.menuItem }
                    onClick = { handleCopyClick }
                    role = 'menuitem'
                    type = 'button'>
                    {t('chat.copy')}
                </button>
            )}
            {isModerator
                && !isModerated
                && messageModerationSupported
                && message.messageType !== MESSAGE_TYPE_LOCAL
                && (
                    <button
                        className = { classes.menuItem }
                        onClick = { handleModerateClick }
                        role = 'menuitem'
                        type = 'button'>
                        {t('chat.delete')}
                    </button>
                )}
            {message.messageType === MESSAGE_TYPE_LOCAL
                && !message.isDeleted
                && !message.isModerated
                && messageModerationSupported
                && (
                    <button
                        className = { classes.menuItem }
                        onClick = { handleDeleteClick }
                        role = 'menuitem'
                        type = 'button'>
                        {t('chat.deleteMessage')}
                    </button>
                )}
        </div>
    );

    return (
        <div>
            <div ref = { buttonRef }>
                <Popover
                    content = { popoverContent }
                    onPopoverClose = { handleClose }
                    position = 'top'
                    trigger = 'click'
                    visible = { isPopoverOpen }>
                    <Button
                        accessibilityLabel = { t('toolbar.accessibilityLabel.moreOptions') }
                        className = { classes.messageMenuButton }
                        icon = { IconDotsHorizontal }
                        onClick = { handleMenuClick }
                        onKeyPress = { handleTriggerKeyPress }
                        ref = { triggerRef }
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
