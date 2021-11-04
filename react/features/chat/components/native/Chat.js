// @flow

import { useIsFocused } from '@react-navigation/native';
import React, { useEffect } from 'react';

import { translate } from '../../../base/i18n';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { connect } from '../../../base/redux';
import { screen } from '../../../conference/components/native/routes';
import { closeChat, openChat } from '../../actions.native';
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
        dispatch,
        navigation,
        route
    } = props;
    const isChatScreenFocused = useIsFocused();
    const privateMessageRecipient = route.params?.privateMessageRecipient;

    const nrUnreadMessages
        = !isChatScreenFocused && _nbUnreadMessages > 0
            ? `(${_nbUnreadMessages})` : '';

    useEffect(() => {
        dispatch(openChat(privateMessageRecipient));

        navigation.setOptions({
            tabBarLabel: `${screen.conference.chatandpolls.tab.chat} ${nrUnreadMessages}`
        });

        return () => dispatch(closeChat());
    }, [ nrUnreadMessages ]);

    return (
        <Chat
            { ...props }
            isChatScreenFocused = { isChatScreenFocused } />
    );
}));
