/* eslint-disable react/no-multi-comp */
import { Route, useIsFocused } from '@react-navigation/native';
import React, { Component, useEffect } from 'react';
import { connect, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { StyleType } from '../../../base/styles/functions.native';
import { TabBarLabelCounter } from '../../../mobile/navigation/components/TabBarLabelCounter';
import { pollsStyles } from '../../../polls/components/native/styles';
import { closeChat, sendMessage } from '../../actions.native';
import { ChatTabs } from '../../constants';
import { IChatProps as AbstractProps } from '../../types';

import ChatInputBar from './ChatInputBar';
import MessageContainer from './MessageContainer';
import MessageRecipient from './MessageRecipient';

interface IProps extends AbstractProps {

    /**
     * The number of unread messages.
     */
    _unreadMessagesCount: number;

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
        this._renderFooter = this._renderFooter.bind(this);
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
                footerComponent = { this._renderFooter }
                hasBottomTextInput = { true }
                hasExtraHeaderHeight = { true }
                style = { pollsStyles.pollPaneContainer as StyleType }>
                {/* @ts-ignore */}
                <MessageContainer messages = { _messages } />
                <MessageRecipient privateMessageRecipient = { privateMessageRecipient } />
            </JitsiScreen>
        );
    }

    /**
     * Renders the footer component.
     *
     * @private
     * @returns {React$Element<*>}
     */
    _renderFooter() {
        return <ChatInputBar onSend = { this._onSendMessage } />;
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
 *     _unreadMessagesCount: number
 * }}
 */
function _mapStateToProps(state: IReduxState, _ownProps: any) {
    const { messages, unreadMessagesCount } = state['features/chat'];

    return {
        _messages: messages,
        _unreadMessagesCount: unreadMessagesCount
    };
}

export default translate(connect(_mapStateToProps)((props: IProps) => {
    const { _unreadMessagesCount, dispatch, navigation, t } = props;

    const isChatTabFocused = useSelector((state: IReduxState) => state['features/chat'].focusedTab === ChatTabs.CHAT);

    const isFocused = useIsFocused();

    const activeUnreadMessagesNr = !isChatTabFocused && _unreadMessagesCount > 0;

    useEffect(() => {
        navigation?.setOptions({
            tabBarLabel: () => (
                <TabBarLabelCounter
                    activeUnreadNr = { activeUnreadMessagesNr }
                    isFocused = { isFocused }
                    label = { t('chat.tabs.chat') }
                    unreadCount = { _unreadMessagesCount } />
            )
        });

        return () => {
            isFocused && dispatch(closeChat());
        };
    }, [ isFocused, _unreadMessagesCount ]);

    return (
        <Chat { ...props } />
    );
}));
