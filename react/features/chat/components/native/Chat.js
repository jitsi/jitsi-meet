// @flow

import React from 'react';
import { View } from 'react-native';
import { Button } from 'react-native-paper';

import { translate } from '../../../base/i18n';
import { JitsiModal } from '../../../base/modal';
import { connect } from '../../../base/redux';
import { PollsPane } from '../../../polls/components';
import { closeChat } from '../../actions.any';
import { BUTTON_MODES, CHAT_VIEW_MODAL_ID } from '../../constants';
import AbstractChat, {
    _mapStateToProps,
    type Props
} from '../AbstractChat';

import ChatInputBar from './ChatInputBar';
import MessageContainer from './MessageContainer';
import MessageRecipient from './MessageRecipient';
import styles from './styles';

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
                {this.props._isPollsEnabled && <View style = { styles.tabContainer }>
                    <Button
                        color = '#17a0db'
                        mode = {
                            this.props._isPollsTabFocused
                                ? BUTTON_MODES.CONTAINED
                                : BUTTON_MODES.TEXT
                        }
                        onPress = { this._onToggleChatTab }
                        style = { styles.tabLeftButton }
                        uppercase = { false }>
                        {`${this.props.t('chat.tabs.chat')}${this.props._isPollsTabFocused
                                && this.props._nbUnreadMessages > 0
                            ? `(${this.props._nbUnreadMessages})`
                            : ''
                        }`}
                    </Button>
                    <Button
                        color = '#17a0db'
                        mode = {
                            this.props._isPollsTabFocused
                                ? BUTTON_MODES.TEXT
                                : BUTTON_MODES.CONTAINED
                        }
                        onPress = { this._onTogglePollsTab }
                        style = { styles.tabRightButton }
                        uppercase = { false }>
                        {`${this.props.t('chat.tabs.polls')}${!this.props._isPollsTabFocused
                                && this.props._nbUnreadPolls > 0
                            ? `(${this.props._nbUnreadPolls})`
                            : ''
                        }`}
                    </Button>
                </View>}
                {this.props._isPollsTabFocused
                    ? <PollsPane />
                    : (
                    <>
                        <MessageContainer messages = { this.props._messages } />
                        <MessageRecipient />
                        <ChatInputBar onSend = { this._onSendMessage } />
                    </>
                    )}
            </JitsiModal>
        );
    }

    _onSendMessage: (string) => void;

    _onClose: () => boolean

    _onTogglePollsTab: () => void;
    _onToggleChatTab: () => void;

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
