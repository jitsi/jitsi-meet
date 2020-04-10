// @flow

import React from 'react';

import { translate } from '../../../base/i18n';
import { JitsiModal } from '../../../base/modal';
import { connect } from '../../../base/redux';

import { CHAT_VIEW_MODAL_ID } from '../../constants';

import AbstractChat, {
    _mapDispatchToProps,
    _mapStateToProps,
    type Props
} from '../AbstractChat';

import ChatInputBar from './ChatInputBar';
import MessageContainer from './MessageContainer';
import MessageRecipient from './MessageRecipient';

/**
 * Implements a React native component that renders the chat window (modal) of
 * the mobile client.
 */
class Chat extends AbstractChat<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <JitsiModal
                headerProps = {{
                    headerLabelKey: 'chat.title'
                }}
                modalId = { CHAT_VIEW_MODAL_ID }>
                <MessageContainer messages = { this.props._messages } />
                <MessageRecipient />
                <ChatInputBar onSend = { this.props._onSendMessage } />
            </JitsiModal>
        );
    }
}

export default translate(connect(_mapStateToProps, _mapDispatchToProps)(Chat));
