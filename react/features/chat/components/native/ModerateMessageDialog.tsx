import React, { useCallback } from 'react';
import { useDispatch, useStore } from 'react-redux';

import { IReduxState } from '../../../app/types';
import InputDialog from '../../../base/dialog/components/native/InputDialog';
import { sendMessageModeration } from '../../actions.any';
import { canModerateMessage, getChatMessageById } from '../../functions';
import logger from '../../logger';

interface IProps {
    messageId: string;
}

/**
 * Asks a moderator for an optional reason before removing a message.
 *
 * @returns {JSX.Element}
 */
const ModerateMessageDialog = ({ messageId }: IProps) => {
    const dispatch = useDispatch();
    const store = useStore<IReduxState>();
    const onSubmit = useCallback((reason?: string) => {
        // Check again on submit: the message or the moderator role can change while the dialog is open.
        const state = store.getState();
        const message = getChatMessageById(state, messageId);

        if (message && canModerateMessage(state, message)) {
            dispatch(sendMessageModeration(message, reason?.trim() || undefined));
        } else {
            logger.warn(`Message ${messageId} can no longer be moderated, skipping.`);
        }

        return true;
    }, [ dispatch, messageId, store ]);

    return (
        <InputDialog
            descriptionKey = 'chat.moderateMessageReason'
            onSubmit = { onSubmit }
            titleKey = 'chat.moderateMessageTitle' />
    );
};

export default ModerateMessageDialog;
