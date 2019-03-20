// @flow

import React from 'react';
import { SafeAreaView, View } from 'react-native';
import { GiftedChat } from 'react-native-gifted-chat';

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

import ChatMessage from './ChatMessage';
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
        this._renderMessage = this._renderMessage.bind(this);
        this._transformMessage = this._transformMessage.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        // Gifted chat requires a special object format and a reversed list
        // of messages.
        const messages
            = this.props._messages.map(this._transformMessage).reverse();

        return (
            <SlidingView
                position = 'bottom'
                show = { this.props._isOpen } >
                <View style = { styles.chatContainer }>
                    <Header>
                        <BackButton onPress = { this.props._onToggleChat } />
                        <HeaderLabel labelKey = 'chat.title' />
                    </Header>
                    <SafeAreaView style = { styles.backdrop }>
                        <GiftedChat
                            messages = { messages }
                            onSend = { this._onSend }
                            renderMessage = { this._renderMessage } />
                    </SafeAreaView>
                </View>
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
    _onSend([ message ]) {
        this.props._onSendMessage(message.text);
    }

    _renderMessage: Object => React$Element<*>

    /**
     * Renders a single message.
     *
     * @param {Object} messageProps - The message props object to be rendered.
     * @returns {React$Element<*>}
     */
    _renderMessage(messageProps) {
        const { currentMessage } = messageProps;

        return (
            <ChatMessage message = { currentMessage } />
        );
    }

    _transformMessage: (Object, number) => Object;

    /**
     * Transforms a Jitsi message object to a format that gifted-chat can
     * handle.
     *
     * @param {Object} message - The chat message in our internal format.
     * @param {number} index - The index of the message in the array.
     * @returns {Object}
     */
    _transformMessage(message, index) {
        const system = message.messageType === 'error';

        return (
            {
                _id: index,
                createdAt: new Date(message.timestamp),
                messageType: message.messageType,
                system,
                text: system
                    ? this.props.t('chat.error', {
                        error: message.error,
                        originalText: message.message
                    })
                    : message.message,
                user: {
                    _id: message.id,
                    name: message.displayName
                }
            }
        );
    }
}

export default translate(connect(_mapStateToProps, _mapDispatchToProps)(Chat));
