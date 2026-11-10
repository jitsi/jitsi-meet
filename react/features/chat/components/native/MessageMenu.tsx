import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { hideSheet, openDialog } from '../../../base/dialog/actions';
import BottomSheet from '../../../base/dialog/components/native/BottomSheet';
import { IconCopy, IconTrash } from '../../../base/icons/svg';
import { copyText } from '../../../base/util/copyText.native';
import { sendMessageRetraction } from '../../actions.any';
import { canModerateMessage, canRetractMessage, getChatMessageById, isFileMessage } from '../../functions';

import MessageMenuItem from './MessageMenuItem';
import ModerateMessageDialog from './ModerateMessageDialog';

interface IProps {
    messageId: string;
}

/**
 * Bottom sheet opened by a long press on a chat message. Reads the message from state,
 * so a retraction or moderation by someone else while it is open hides the rows.
 *
 * @returns {JSX.Element}
 */
const MessageMenu = ({ messageId }: IProps) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const message = useSelector((state: IReduxState) => getChatMessageById(state, messageId));
    const canRetract = useSelector((state: IReduxState) => Boolean(message && canRetractMessage(state, message)));
    const canModerate = useSelector((state: IReduxState) => Boolean(message && canModerateMessage(state, message)));
    const isEmpty = !canRetract && !canModerate;

    useEffect(() => {
        isEmpty && dispatch(hideSheet());
    }, [ dispatch, isEmpty ]);

    // The sheet takes a moment to close, so a second tap could act twice.
    const handled = useRef(false);

    const onCopy = useCallback(() => {
        dispatch(hideSheet());
        message && copyText(message.message);
    }, [ dispatch, message ]);

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

    return (
        <BottomSheet>
            { message && !isFileMessage(message) && (
                <MessageMenuItem
                    icon = { IconCopy }
                    label = { t('chat.copy') }
                    onPress = { onCopy } />
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
