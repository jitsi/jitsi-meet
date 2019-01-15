// @flow

import React from 'react';
import { SafeAreaView } from 'react-native';
import { GiftedChat } from 'react-native-gifted-chat';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n';
import { BackButton, Header, HeaderLabel, Modal } from '../../../base/react';

import AbstractChat, {
    _mapDispatchToProps,
    _mapStateToProps as _abstractMapStateToProps,
    type Props as AbstractProps
} from '../AbstractChat';

import ChatMessage from './ChatMessage';
import styles from './styles';

type Props = AbstractProps & {

    /**
     * True if the chat window should have a solid BG render.
     */
    _solidBackground: boolean
}


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
        const modalStyle = [
            styles.modalBackdrop
        ];

        if (this.props._solidBackground) {
            // We only use a transparent background, when we are in a video
            // meeting to give a user a glympse of what's happening. Otherwise
            // we use a non-transparent background.
            modalStyle.push(styles.solidModalBackdrop);
        }

        return (
            <Modal
                onRequestClose = { this.props._onToggleChat }
                visible = { this.props._isOpen }>
                <Header>
                    <BackButton onPress = { this.props._onToggleChat } />
                    <HeaderLabel labelKey = 'chat.title' />
                </Header>
                <SafeAreaView style = { modalStyle }>
                    <GiftedChat
                        messages = { messages }
                        onSend = { this._onSend }
                        renderMessage = { this._renderMessage } />
                </SafeAreaView>
            </Modal>
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

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {{
 *     _solidBackground: boolean
 * }}
 */
function _mapStateToProps(state) {
    const abstractReduxProps = _abstractMapStateToProps(state);

    return {
        ...abstractReduxProps,
        _solidBackground: state['features/base/conference'].audioOnly
    };
}

export default translate(connect(_mapStateToProps, _mapDispatchToProps)(Chat));
