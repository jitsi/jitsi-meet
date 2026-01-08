/* eslint-disable react/no-multi-comp */
import { Route, useIsFocused } from '@react-navigation/native';
import React, { Component, useEffect } from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { TabBarLabelCounter } from '../../../mobile/navigation/components/TabBarLabelCounter';
import { getUnreadPollCount } from '../../../polls/functions';
import { closeChat, sendMessage } from '../../actions.native';
import { getUnreadFilesCount } from '../../functions';
import { IChatProps as AbstractProps } from '../../types';

import ChatInputBar from './ChatInputBar';
import MessageContainer from './MessageContainer';
import MessageRecipient from './MessageRecipient';
import styles from './styles';

interface IProps extends AbstractProps {

    /**
     * The number of unread file messages.
     */
    _unreadFilesCount: number;

    /**
     * The number of unread messages.
     */
    _unreadMessagesCount: number;

    /**
     * The number of unread polls.
     */
    _unreadPollsCount: number;

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
class Chat extends Component<IProps> {

    /**
     * Initializes a new {@code AbstractChat} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code AbstractChat} instance with.
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onSendMessage = this._onSendMessage.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    override render() {
        const { _messages, route } = this.props;
        const privateMessageRecipient = route?.params?.privateMessageRecipient;

        return (
            <JitsiScreen
                disableForcedKeyboardDismiss = { true }

                /* eslint-disable react/jsx-no-bind */
                footerComponent = { () =>
                    <ChatInputBar onSend = { this._onSendMessage } />
                }
                hasBottomTextInput = { true }
                hasExtraHeaderHeight = { true }
                style = { styles.chatContainer }>
                {/* @ts-ignore */}
                <MessageContainer messages = { _messages } />
                <MessageRecipient privateMessageRecipient = { privateMessageRecipient } />
            </JitsiScreen>
        );
    }

    /**
    * Sends a text message.
    *
    * @private
    * @param {string} text - The text message to be sent.
    * @returns {void}
    * @type {Function}
    */
    _onSendMessage(text: string) {
        this.props.dispatch(sendMessage(text));
    }
}

/**
 * Maps (parts of) the redux state to {@link Chat} React {@code Component}
 * props.
 *
 * @param {Object} state - The redux store/state.
 * @param {any} _ownProps - Components' own props.
 * @private
 * @returns {{
 *     _messages: Array<Object>,
 *     _unreadMessagesCount: number,
 *     _unreadPollsCount: number,
 *     _unreadFilesCount: number
 * }}
 */
function _mapStateToProps(state: IReduxState, _ownProps: any) {
    const { messages, unreadMessagesCount } = state['features/chat'];

    return {
        _messages: messages,
        _unreadMessagesCount: unreadMessagesCount,
        _unreadPollsCount: getUnreadPollCount(state),
        _unreadFilesCount: getUnreadFilesCount(state)
    };
}

export default translate(connect(_mapStateToProps)((props: IProps) => {
    const { _unreadMessagesCount, _unreadPollsCount, _unreadFilesCount, dispatch, navigation, t } = props;
    const totalUnread = _unreadMessagesCount + _unreadPollsCount + _unreadFilesCount;
    const unreadMessagesNr = totalUnread > 0;

    const isFocused = useIsFocused();

    useEffect(() => {
        navigation?.setOptions({
            tabBarLabel: () => (
                <TabBarLabelCounter
                    activeUnreadNr = { unreadMessagesNr }
                    isFocused = { isFocused }
                    label = { t('chat.tabs.chat') }
                    unreadCount = { totalUnread } />
            )
        });

        return () => {
            isFocused && dispatch(closeChat());
        };
    }, [ isFocused, _unreadMessagesCount, _unreadPollsCount, _unreadFilesCount ]);

    return (
        <Chat { ...props } />
    );
}));
