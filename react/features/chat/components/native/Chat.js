// @flow

import React from 'react';

import { translate } from '../../../base/i18n';
import { JitsiModal } from '../../../base/modal';
import { connect } from '../../../base/redux';
import { closeChat } from '../../actions.any';
import { CHAT_VIEW_MODAL_ID } from '../../constants';
import AbstractChat, {
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
     * Creates a new instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onClose = this._onClose.bind(this);
    }

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
                modalId = { CHAT_VIEW_MODAL_ID }
                onClose = { this._onClose }>

                <MessageContainer messages = { this.props._messages } />
                <MessageRecipient />
                <ChatInputBar onSend = { this._onSendMessage } />
            </JitsiModal>
        );
    }

    _onSendMessage: (string) => void;

    _onClose: () => boolean

    /**
     * Closes the modal.
     *
     * @returns {boolean}
     */
    _onClose() {
        this.props.dispatch(closeChat());

        return true;
    }
}

export default translate(connect(_mapStateToProps)(Chat));
