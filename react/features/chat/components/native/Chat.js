// @flow

import { useIsFocused } from '@react-navigation/native';
import React, { useEffect } from 'react';

import { translate } from '../../../base/i18n';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { connect } from '../../../base/redux';
import { closeChat } from '../../actions.any';
import AbstractChat, {
    _mapStateToProps,
    type Props as AbstractProps
} from '../AbstractChat';

import ChatInputBar from './ChatInputBar';
import MessageContainer from './MessageContainer';
import MessageRecipient from './MessageRecipient';
import styles from './styles';


type Props = AbstractProps & {

    /**
     * Is this screen focused or not(React Navigation).
     */
    isChatScreenFocused: boolean,

    /**
     * Default prop for navigating between screen components(React Navigation).
     */
    navigation: Object,

    /**
     * Default prop for navigating between screen components(React Navigation).
     */
    route: Object
};

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
        const { _messages, route } = this.props;
        const privateMessageRecipient = route.params?.privateMessageRecipient;

        return (
            <JitsiScreen
                disableForcedKeyboardDismiss = { true }
                hasBottomTextInput = { true }
                hasTabNavigator = { true }
                style = { styles.chatContainer }>
                <MessageContainer messages = { _messages } />
                <MessageRecipient privateMessageRecipient = { privateMessageRecipient } />
                <ChatInputBar onSend = { this._onSendMessage } />
            </JitsiScreen>
        );
    }

    _onSendMessage: (string) => void;
}

export default translate(connect(_mapStateToProps)(props => {
    const {
        _nbUnreadMessages,
        navigation,
        t
    } = props;
    const isChatScreenFocused = useIsFocused();

    const nrUnreadMessages
        = !isChatScreenFocused && _nbUnreadMessages > 0
            ? `(${_nbUnreadMessages})` : '';

    useEffect(() => {
        navigation.setOptions({
            tabBarLabel: `${t('chat.tabs.chat')} ${nrUnreadMessages}`
        });

        return () => props.dispatch(closeChat());
    }, [ nrUnreadMessages ]);

    return (
        <Chat
            { ...props }
            isChatScreenFocused = { isChatScreenFocused } />
    );
}));
