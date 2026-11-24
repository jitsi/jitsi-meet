/* eslint-disable react/no-multi-comp */
import { Route, useIsFocused } from '@react-navigation/native';
import React, { Component, useEffect } from 'react';
import { Platform, Text, TextStyle, View, ViewStyle } from 'react-native';
import { connect, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions.native';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { StyleType } from '../../../base/styles/functions.native';
import { TabBarLabelCounter } from '../../../mobile/navigation/components/TabBarLabelCounter';
import { pollsStyles } from '../../../polls/components/native/styles';
import { sendMessageEdit } from '../../actions.any';
import { clearChatSearch, closeChat, sendMessage } from '../../actions.native';
import { ChatTabs } from '../../constants';
import { IChatProps as AbstractProps, IMessage } from '../../types';

import ChatInputBar from './ChatInputBar';
import ChatSearchBar from './ChatSearchBar';
import MessageContainer from './MessageContainer';
import MessageRecipient from './MessageRecipient';
import styles from './styles';

/**
 * How long the "Message copied" hint shows.
 */
const COPIED_HINT_TIMEOUT = 2000;

/**
 * Android 13 (API 33) and later shows its own clipboard confirmation, so the hint would show twice.
 */
const SHOW_COPIED_HINT = Platform.OS !== 'android' || Number(Platform.Version) < 33;

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

interface IState {

    /**
     * The id of the local message being edited, as on web.
     */
    editingMessageId?: string;

    /**
     * Whether the "Message copied" hint shows, as on web.
     */
    showCopiedHint?: boolean;
}

/**
 * Implements a React native component that renders the chat window (modal) of
 * the mobile client.
 */
class Chat extends Component<IProps, IState> {
    _copiedHintTimeout?: ReturnType<typeof setTimeout>;

    /**
     * Initializes a new {@code AbstractChat} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code AbstractChat} instance with.
     */
    constructor(props: IProps) {
        super(props);

        this.state = {};

        // Bind event handlers so they are only bound once per instance.
        this._onCancelEdit = this._onCancelEdit.bind(this);
        this._onEditMessage = this._onEditMessage.bind(this);
        this._onMessageCopied = this._onMessageCopied.bind(this);
        this._onSendMessage = this._onSendMessage.bind(this);
        this._renderFooter = this._renderFooter.bind(this);
    }

    /**
     * Implements React's {@link Component#componentWillUnmount()}.
     *
     * @inheritdoc
     */
    override componentWillUnmount() {
        clearTimeout(this._copiedHintTimeout);
    }

    /**
     * Shows the "Message copied" hint, from the message menu. A new copy restarts the timeout.
     *
     * @returns {void}
     */
    _onMessageCopied() {
        if (!SHOW_COPIED_HINT) {
            return;
        }

        clearTimeout(this._copiedHintTimeout);
        this.setState({ showCopiedHint: true });
        this._copiedHintTimeout = setTimeout(() => this.setState({ showCopiedHint: false }), COPIED_HINT_TIMEOUT);
    }

    /**
     * Leaves edit mode when the edited message is retracted or moderated meanwhile.
     *
     * @inheritdoc
     */
    override componentDidUpdate() {
        if (this.state.editingMessageId && !this._getEditingMessage()) {
            this._onCancelEdit();
        }
    }

    /**
     * Returns the message being edited, if it can still be edited.
     *
     * @returns {IMessage | undefined}
     */
    _getEditingMessage(): IMessage | undefined {
        const { editingMessageId } = this.state;
        const message = editingMessageId
            ? this.props._messages.find(m => m.messageId === editingMessageId)
            : undefined;

        return message && !message.isDeleted && !message.isModerated ? message : undefined;
    }

    /**
     * Leaves edit mode.
     *
     * @returns {void}
     */
    _onCancelEdit() {
        this.setState({ editingMessageId: undefined });
    }

    /**
     * Enters edit mode for a message, from the message menu.
     *
     * @param {string} messageId - The id of the message.
     * @returns {void}
     */
    _onEditMessage(messageId: string) {
        this.setState({ editingMessageId: messageId });
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
                <ChatSearchBar />
                <View style = { styles.messageListArea as ViewStyle }>
                    <MessageContainer

                        // @ts-ignore
                        messages = { _messages }
                        onEditMessage = { this._onEditMessage }
                        onMessageCopied = { this._onMessageCopied } />
                    { this.state.showCopiedHint && (
                        <View
                            pointerEvents = 'none'
                            style = { styles.copiedHint as ViewStyle }>
                            <Text style = { styles.copiedHintText as TextStyle }>
                                { this.props.t('chat.messageCopied') }
                            </Text>
                        </View>
                    ) }
                </View>
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
        return (
            <ChatInputBar
                editingMessage = { this._getEditingMessage() }
                onCancelEdit = { this._onCancelEdit }
                onSend = { this._onSendMessage } />
        );
    }

    /**
    * Sends a text message, or the new text of the message being edited.
    *
    * @private
    * @param {string} text - The text message to be sent.
    * @returns {void}
    * @type {Function}
    */
    _onSendMessage(text: string) {
        const editingMessage = this._getEditingMessage();

        if (editingMessage) {
            this.props.dispatch(sendMessageEdit(editingMessage.messageId, text));
            this._onCancelEdit();

            return;
        }

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
            if (isFocused) {
                dispatch(closeChat());
                dispatch(clearChatSearch());
            }
        };
    }, [ isFocused, _unreadMessagesCount ]);

    return (
        <Chat { ...props } />
    );
}));
