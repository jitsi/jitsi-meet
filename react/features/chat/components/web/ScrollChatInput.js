// @flow
import { Checkbox } from '@atlaskit/checkbox';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { disableChatScroll } from '../../actions.any';

/**
 * Scroll Chat Input.
 *
 * @returns {ReactElement}
 */
const ScrollChatInput = () => {

    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { scrollChat } = useSelector(state => state['features/chat']);

    const toggleChatScroll = useCallback(() => {
        dispatch(disableChatScroll(!scrollChat));
    });

    return (
        <div>
            <Checkbox
                isChecked = { scrollChat }
                label = { scrollChat ? t('chat.chatScrollDisabled') : t('chat.chatScrollEnabled') }
                name = 'enable-disable-chat-scroll'
                onChange = { toggleChatScroll } />
        </div>
    );
};

export default ScrollChatInput;
