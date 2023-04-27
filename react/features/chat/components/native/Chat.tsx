/* eslint-disable react/no-multi-comp */
import { Route, useIsFocused } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { TabBarLabelCounter } from '../../../mobile/navigation/components/TabBarLabelCounter';
import { closeChat } from '../../actions.native';
import AbstractChat, {
    IProps as AbstractProps,
    _mapStateToProps
} from '../AbstractChat';

import ChatInputBar from './ChatInputBar';
import MessageContainer from './MessageContainer';
import MessageRecipient from './MessageRecipient';
import styles from './styles';

interface IProps extends AbstractProps {

    /**
     * Default prop for navigating between screen components(React Navigation).
     */
    navigation: any;

    /**
     * Default prop for navigating between screen components(React Navigation).
     */
    route: Route<'', { privateMessageRecipient: { name: string; }; }>;
}

/**
 * Implements a React native component that renders the chat window (modal) of
 * the mobile client.
 */
class Chat extends AbstractChat<IProps> {
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
                {/* @ts-ignore */}
                <MessageContainer messages = { _messages } />
                <MessageRecipient privateMessageRecipient = { privateMessageRecipient } />
                <ChatInputBar onSend = { this._onSendMessage } />
            </JitsiScreen>
        );
    }
}

export default translate(connect(_mapStateToProps)((props: IProps) => {
    const { _nbUnreadMessages, dispatch, navigation, t } = props;
    const unreadMessagesNr = _nbUnreadMessages > 0;

    const isFocused = useIsFocused();

    useEffect(() => {
        navigation?.setOptions({
            tabBarLabel: () => (
                <TabBarLabelCounter
                    activeUnreadNr = { unreadMessagesNr }
                    isFocused = { isFocused }
                    label = { t('chat.tabs.chat') }
                    nbUnread = { _nbUnreadMessages } />
            )
        });

        return () => {
            isFocused && dispatch(closeChat());
        };
    }, [ isFocused, _nbUnreadMessages ]);

    return (
        <Chat { ...props } />
    );
}));
