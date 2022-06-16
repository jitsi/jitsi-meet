import React from 'react';

import { translate } from '../../../base/i18n';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { connect } from '../../../base/redux';
import ChatInputBar from '../../../chat/components/native/ChatInputBar';
import MessageContainer from '../../../chat/components/native/MessageContainer';
import AbstractLobbyScreen, {
    Props as AbstractProps,
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
    render() {
        const { _lobbyChatMessages } = this.props;

        return (
            <JitsiScreen style = { styles.lobbyChatWrapper }>
                <MessageContainer messages = { _lobbyChatMessages } />
                <ChatInputBar onSend = { this._onSendMessage } />
            </JitsiScreen>
        );
    }

    _onSendMessage: () => void;
}

export default translate(connect(abstractMapStateToProps)(LobbyChatScreen));
