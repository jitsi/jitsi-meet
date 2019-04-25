// @flow

import React from 'react';
import { KeyboardAvoidingView, SafeAreaView } from 'react-native';

import { translate } from '../../../base/i18n';

import {
    BackButton,
    Header,
    HeaderLabel,
    SlidingView
} from '../../../base/react';
import { connect } from '../../../base/redux';

import AbstractChat, {
    _mapDispatchToProps,
    _mapStateToProps,
    type Props
} from '../AbstractChat';

import ChatInputBar from './ChatInputBar';
import MessageContainer from './MessageContainer';
import styles from './styles';

/**
 * Implements a React native component that renders the chat window (modal) of
 * the mobile client.
 */
class Chat extends AbstractChat<Props> {
    /**
       * Initializes a new instance.
       *
       * @inheritdoc
       */
    constructor(props: Props) {
        super(props);

        this._onSend = this._onSend.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <SlidingView
                position = 'bottom'
                show = { this.props._isOpen } >
                <KeyboardAvoidingView
                    behavior = 'padding'
                    style = { styles.chatContainer }>
                    <Header>
                        <BackButton onPress = { this.props._onToggleChat } />
                        <HeaderLabel labelKey = 'chat.title' />
                    </Header>
                    <SafeAreaView style = { styles.backdrop }>
                        <MessageContainer messages = { this.props._messages } />
                        <ChatInputBar onSend = { this._onSend } />
                    </SafeAreaView>
                </KeyboardAvoidingView>
            </SlidingView>
        );
    }

    _onSend: (Array<Object>) => void;

    /**
     * Callback to trigger a message send action.
     *
     * @param {string} message - The chat message to display.
     * @returns {void}
     */
    _onSend(message) {
        this.props._onSendMessage(message);
    }
}

export default translate(connect(_mapStateToProps, _mapDispatchToProps)(Chat));
