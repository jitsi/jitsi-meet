/* eslint-disable react/no-multi-comp */

import React, { useEffect } from 'react';

import { translate } from '../../../base/i18n';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { connect } from '../../../base/redux';
import { TabBarLabelCounter } from '../../../mobile/navigation/components/TabBarLabelCounter';
import { closeChat } from '../../actions.native';
import AbstractChat, {
    type Props as AbstractProps,
    _mapStateToProps
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
     * Implements the Component's componentDidMount method.
     *
     * @inheritdoc
     */
    componentDidMount() {
        const { navigation, t } = this.props;

        navigation?.setOptions({
            tabBarLabel: () => (
                <TabBarLabelCounter
                    activeUnreadNr = { false }
                    t = { t('chat.tabs.chat') } />
            )
        });
    }

    /**
     * Implements React Component's componentDidUpdate.
     *
     * @inheritdoc
     */
    componentDidUpdate() {
        const { _isPollsTabFocused, _nbUnreadMessages, navigation, t } = this.props;
        const unreadMessagesNr = _isPollsTabFocused && _nbUnreadMessages > 0;

        navigation?.setOptions({
            tabBarLabel: () => (
                <TabBarLabelCounter
                    activeUnreadNr = { unreadMessagesNr }
                    nbUnread = { _nbUnreadMessages }
                    t = { t('chat.tabs.chat') } />
            )
        });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const { _messages, route } = this.props;
        const privateMessageRecipient = route?.params?.privateMessageRecipient;

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
    useEffect(() => {
        const { dispatch } = props;

        return () => dispatch(closeChat());
    });

    return (
        <Chat { ...props } />
    );
}));
