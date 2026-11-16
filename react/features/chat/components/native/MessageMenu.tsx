import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { hideSheet, openDialog } from '../../../base/dialog/actions';
import BottomSheet from '../../../base/dialog/components/native/BottomSheet';
import { IconCopy, IconEdit, IconTrash } from '../../../base/icons/svg';
import { copyText } from '../../../base/util/copyText.native';
import { sendMessageRetraction, sendReaction } from '../../actions.any';
import {
    canEditMessage,
    canModerateMessage,
    canReactToMessage,
    canRetractMessage,
    getChatMessageById,
    isFileMessage
} from '../../functions';
import logger from '../../logger';
import { IMessageMenuProps } from '../../types';

import EmojiSelector from './EmojiSelector';
import MessageMenuItem from './MessageMenuItem';
import MessagePreview from './MessagePreview';
import ModerateMessageDialog from './ModerateMessageDialog';

/**
 * Bottom sheet opened by a long press on a chat message. Reads the message from state,
 * so a retraction or moderation by someone else while it is open hides the rows.
 *
 * @returns {JSX.Element}
 */
const MessageMenu = ({
    anchor,
    messageId,
    onCopy,
    onEdit,
    onLift,
    showAvatar,
    showDisplayName,
    showTimestamp
}: IMessageMenuProps) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const message = useSelector((state: IReduxState) => getChatMessageById(state, messageId));
    const canEdit = useSelector((state: IReduxState) => Boolean(onEdit && message && canEditMessage(state, message)));
    const canReact = useSelector((state: IReduxState) => Boolean(message && canReactToMessage(state, message)));
    const canRetract = useSelector((state: IReduxState) => Boolean(message && canRetractMessage(state, message)));
    const canModerate = useSelector((state: IReduxState) => Boolean(message && canModerateMessage(state, message)));
    const isEmpty = !canEdit && !canReact && !canRetract && !canModerate;

    useEffect(() => {
        isEmpty && dispatch(hideSheet());
    }, [ dispatch, isEmpty ]);

    // The sheet takes a moment to close, so a second tap could act twice.
    const handled = useRef(false);

    const onCopyPress = useCallback(() => {
        dispatch(hideSheet());

        if (!message) {
            return;
        }

        if (copyText(message.message)) {
            onCopy?.();
        } else {
            logger.warn(`Failed to copy message ${messageId}`);
        }
    }, [ dispatch, message, messageId, onCopy ]);

    const onEditPress = useCallback(() => {
        dispatch(hideSheet());
        onEdit?.(messageId);
    }, [ dispatch, messageId, onEdit ]);

    // Group chat only (canReactToMessage), so no receiver, as on web.
    const onReact = useCallback((emoji: string) => {
        if (handled.current) {
            return;
        }
        handled.current = true;
        dispatch(hideSheet());
        dispatch(sendReaction(emoji, messageId, ''));
    }, [ dispatch, messageId ]);

    const onRetract = useCallback(() => {
        if (handled.current || !message) {
            return;
        }
        handled.current = true;
        dispatch(hideSheet());
        dispatch(sendMessageRetraction(message));
    }, [ dispatch, message ]);

    const onModerate = useCallback(() => {
        if (handled.current) {
            return;
        }
        handled.current = true;
        dispatch(hideSheet());
        dispatch(openDialog('ModerateMessageDialog', ModerateMessageDialog, { messageId }));
    }, [ dispatch, messageId ]);

    // The backdrop can sit off the window origin, e.g. in an SDK view that does not fill the screen.
    const overlayRef = useRef<View>(null);
    const [ overlayOrigin, setOverlayOrigin ] = useState<{ x: number; y: number; }>();

    const onOverlayLayout = useCallback(() => {
        overlayRef.current?.measureInWindow((x, y) => setOverlayOrigin({ x, y }));
    }, []);

    const renderOverlay = useCallback((sheetTop?: number) => {
        if (!anchor || !message) {
            return null;
        }

        return (
            <View
                onLayout = { onOverlayLayout }
                pointerEvents = 'none'
                ref = { overlayRef }
                style = { StyleSheet.absoluteFill }>
                { overlayOrigin && sheetTop !== undefined && (
                    <MessagePreview
                        anchor = { anchor }
                        message = { message }
                        onLift = { onLift }
                        origin = { overlayOrigin }
                        sheetTop = { sheetTop }
                        showAvatar = { showAvatar }
                        showDisplayName = { showDisplayName }
                        showTimestamp = { showTimestamp } />
                ) }
            </View>
        );
    }, [ anchor, message, onLift, onOverlayLayout, overlayOrigin, showAvatar, showDisplayName, showTimestamp ]);

    return (
        <BottomSheet renderOverlay = { renderOverlay }>
            { canReact && <EmojiSelector onSelect = { onReact } /> }
            { message && !isFileMessage(message) && (
                <MessageMenuItem
                    icon = { IconCopy }
                    label = { t('chat.copy') }
                    onPress = { onCopyPress } />
            ) }
            { canEdit && (
                <MessageMenuItem
                    icon = { IconEdit }
                    label = { t('chat.edit') }
                    onPress = { onEditPress } />
            ) }
            { canRetract && (
                <MessageMenuItem
                    icon = { IconTrash }
                    label = { t('chat.deleteMessage') }
                    onPress = { onRetract } />
            ) }
            { canModerate && (
                <MessageMenuItem
                    icon = { IconTrash }
                    label = { t('chat.delete') }
                    onPress = { onModerate } />
            ) }
        </BottomSheet>
    );
};

export default MessageMenu;
