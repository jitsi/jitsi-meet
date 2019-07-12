// @flow

import React from 'react';
import { KeyboardAvoidingView, SafeAreaView } from 'react-native';

import { translate } from '../../../base/i18n';

import { HeaderWithNavigation, SlidingView } from '../../../base/react';
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
     * Instantiates a new instance.
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
            <SlidingView
                onHide = { this._onClose }
                position = 'bottom'
                show = { this.props._isOpen } >
                <KeyboardAvoidingView
                    behavior = 'padding'
                    style = { styles.chatContainer }>
                    <HeaderWithNavigation
                        headerLabelKey = 'chat.title'
                        onPressBack = { this._onClose } />
                    <SafeAreaView style = { styles.backdrop }>
                        <MessageContainer messages = { this.props._messages } />
                        <ChatInputBar onSend = { this.props._onSendMessage } />
                    </SafeAreaView>
                </KeyboardAvoidingView>
            </SlidingView>
        );
    }

    _onClose: () => boolean

    /**
     * Closes the chat window.
     *
     * @returns {boolean}
     */
    _onClose() {
        if (this.props._isOpen) {
            this.props._onToggleChat();

            return true;
        }

        return false;
    }
}

export default translate(connect(_mapStateToProps, _mapDispatchToProps)(Chat));
