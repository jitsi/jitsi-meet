import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import ChatInputBar from '../../../chat/components/native/ChatInputBar';
import MessageContainer from '../../../chat/components/native/MessageContainer';
import AbstractLobbyScreen, {
    IProps as AbstractProps,
    _mapStateToProps as abstractMapStateToProps
} from '../AbstractLobbyScreen';

import styles from './styles';


/**
 * Implements a chat screen that appears when communication is started
 * between the moderator and the participant being in the lobby.
 */
class LobbyChatScreen extends
    AbstractLobbyScreen<AbstractProps> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        const { _lobbyChatMessages } = this.props;

        return (
            <JitsiScreen
                hasBottomTextInput = { true }
                hasExtraHeaderHeight = { true }
                style = { styles.lobbyChatWrapper }>
                {/* @ts-ignore */}
                <MessageContainer messages = { _lobbyChatMessages } />
                <ChatInputBar onSend = { this._onSendMessage } />
            </JitsiScreen>
        );
    }

    _onSendMessage: () => void;
}

export default translate(connect(abstractMapStateToProps)(LobbyChatScreen));
