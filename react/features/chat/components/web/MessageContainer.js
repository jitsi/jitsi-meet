// @flow
import throttle from 'lodash/throttle';
import React from 'react';
import { scrollIntoView } from 'seamless-scroll-polyfill';

import { MESSAGE_TYPE_REMOTE } from '../../constants';
import AbstractMessageContainer, { type Props }
    from '../AbstractMessageContainer';

import ChatMessageGroup from './ChatMessageGroup';
import NewMessagesButton from './NewMessagesButton';

type State = {
    isScrolledToBottom: boolean;
    hasNewMessages: boolean;
    lastReadMessageId: string;
};

/**
 * Displays all received chat messages, grouped by sender.
 *
 * @augments AbstractMessageContainer
 */
class MessageContainer extends AbstractMessageContainer<Props, State> {
    state: State = {
        isScrolledToBottom: true,
        hasNewMessages: false,
        lastReadMessageId: null
    };


    /**
     * Reference to the HTML element at the end of the list of displayed chat
     * messages. Used for scrolling to the end of the chat messages.
     */
    _messagesListEndRef: Object;

    /**
     * A React ref to the HTML element containing all {@code ChatMessageGroup}
     * instances.
     */
    _messageListRef: Object;

    /**
     * Intersection observer of the Intersection Observer API.
     */
    _bottomListObserver: IntersectionObserver;

    /**
     * Initializes a new {@code MessageContainer} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code MessageContainer} instance with.
     */
    constructor(props: Props) {
        super(props);

        this._messageListRef = React.createRef();
        this._messagesListEndRef = React.createRef();

        // Bind event handlers so they are only bound once for every instance.
        this._createBottomListObserver = this._createBottomListObserver.bind(this);
        this._handleIntersectBottomList = this._handleIntersectBottomList.bind(this);

        this._findFirstUnreadMessage = this._findFirstUnreadMessage.bind(this);
        this._isMessageVisible = this._isMessageVisible.bind(this);
        this._onChatScroll = throttle(this._onChatScroll.bind(this), 2000, { leading: true });
        this._onGoToFirstUnreadMessage = this._onGoToFirstUnreadMessage.bind(this);
    }

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const groupedMessages = this._getMessagesGroupedBySender();
        const messages = groupedMessages.map((group, index) => {
            const messageType = group[0] && group[0].messageType;

            return (
                <ChatMessageGroup
                    className = { messageType || MESSAGE_TYPE_REMOTE }
                    key = { index }
                    messages = { group } />
            );
        });

        return (
            <div id = 'chat-conversation-container'>
                <div
                    aria-labelledby = 'chat-header'
                    id = 'chatconversation'
                    onScroll = { this._onChatScroll }
                    ref = { this._messageListRef }
                    role = 'log'
                    tabIndex = { 0 }>
                    <div />
                    { messages }

                    { !this.state.isScrolledToBottom && this.state.hasNewMessages
                        && <NewMessagesButton
                            onGoToFirstUnreadMessage = { this._onGoToFirstUnreadMessage } /> }
                    <div
                        id = 'messagesListEnd'
                        ref = { this._messagesListEndRef } />
                </div>
            </div>
        );
    }


    /**
     * Implements {@code Component#componentDidUpdate}.
     * When Component mount scroll message container to bottom.
     * Create observer to react when scroll position is at bottom or leave the bottom.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this.scrollToElement(false, null);
        this._createBottomListObserver();
    }

    /**
     * Implements {@code Component#componentDidUpdate}.
     * If user receive a new message either scroll automatically to the bottom if scroll position was at the bottom.
     * Otherwise update hasNewMessages from component state.
     *
     * @inheritdoc
     * * @returns {void}
     */
    componentDidUpdate(prevProps) {
        const hasNewMessages = this.props.messages !== prevProps.messages
            && this.props.messages.length !== prevProps.messages.length;

        if (hasNewMessages && this.state.isScrolledToBottom) {
            this.scrollToElement(true, null);
        }

        if (hasNewMessages && !this.state.isScrolledToBottom) {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({ hasNewMessages: true });
        }
    }

    /**
     * Implements React's {@link Component#componentWillUnmount()}. Invoked
     * immediately before this component is unmounted and destroyed.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        const target = document.querySelector('#messagesListEnd');

        this._bottomListObserver.unobserve(target);
    }

    /**
     * Automatically scrolls the displayed chat messages to bottom or to a specific element if it is provided.
     *
     * @param {boolean} withAnimation - Whether or not to show a scrolling.
     * @param {TMLElement} element - Where to scroll.
     * Animation.
     * @returns {void}
     */
    scrollToElement(withAnimation, element) {
        const scrollTo = element ? element : this._messagesListEndRef.current;
        const block = element ? 'center' : 'nearest';

        scrollIntoView(scrollTo, {
            behavior: withAnimation ? 'smooth' : 'auto',
            block
        });
    }

    _getMessagesGroupedBySender: () => Array<Array<Object>>;

    _onChatScroll: () => void;

    /**
     * Callback invoked to listen to current scroll position and update next unread message.
     * The callback is invoked inside a throttle with 2000 ms to decrease the number of function calls.
     *
     * @private
     * @returns {void}
     */
    _onChatScroll() {
        const firstUnreadMessage = this._findFirstUnreadMessage();

        if (firstUnreadMessage && firstUnreadMessage.id !== this.state.lastReadMessageId) {
            this.setState({ lastReadMessageId: firstUnreadMessage?.id });
        }
    }

    /**
     * Callback invoked to listen to current scroll position and update next unread message.
     * The callback is invoked inside a throttle with 2000 ms to decrease the number of function calls.
     *
     * @private
     * @returns {void}
     */
    _onChatScroll() {
        const firstUnreadMessage = this._findFirstUnreadMessage();

        if (firstUnreadMessage && firstUnreadMessage.id !== this.state.lastReadMessageId) {
            this.setState({ lastReadMessageId: firstUnreadMessage?.id });
        }
    }

    _onGoToFirstUnreadMessage: () => void;

    /**
     * Find the first unread message.
     * Update component state and scroll to element.
     *
     * @private
     * @returns {void}
     */
    _onGoToFirstUnreadMessage() {
        const firstUnreadMessage = this._findFirstUnreadMessage();

        this.setState({ lastReadMessageId: firstUnreadMessage?.id || null });
        this.scrollToElement(true, firstUnreadMessage);
    }

    _createBottomListObserver: () => void;

    /**
    * Create observer to react when scroll position is at bottom or leave the bottom.
    *
    * @private
    * @returns {void}
    */
    _createBottomListObserver() {
        const options = {
            root: document.querySelector('#chatconversation'),
            rootMargin: '35px',
            threshold: 0.5
        };

        const target = document.querySelector('#messagesListEnd');

        if (target) {
            this._bottomListObserver = new IntersectionObserver(this._handleIntersectBottomList, options);
            this._bottomListObserver.observe(target);
        }
    }

    _handleIntersectBottomList: () => void;

    /** .
    * _HandleIntersectBottomList.
    * When entry is intersecting with bottom of container set last message as last read message.
    * When entry is not intersecting update only isScrolledToBottom with false value.
    *
    * @param {Array} entries - List of entries.
    * @private
    * @returns {void}
    */
    _handleIntersectBottomList(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && this.props.messages.length) {
                const lastMessageIndex = this.props.messages.length - 1;
                const lastMessage = this.props.messages[lastMessageIndex];
                const lastReadMessageId = lastMessage.messageId;

                this.setState(
                    {
                        isScrolledToBottom: true,
                        hasNewMessages: false,
                        lastReadMessageId
                    });
            }

            if (!entry.isIntersecting) {
                this.setState(
                    {
                        isScrolledToBottom: false
                    });
            }
        });
    }

    _findFirstUnreadMessage: () => HtmlElement;

    /**
    * Find first unread message.
    * MessageIsAfterLastSeenMessage filter elements which are not visible but are before the last read message.
    *
    * @private
    * @returns {HtmlElement}
    */
    _findFirstUnreadMessage() {
        const messagesNodeList = document.querySelectorAll('.chatmessage-wrapper');
        const messagesToArray = [ ...messagesNodeList ];

        const previousIndex = messagesToArray.findIndex(message => message.id === this.state.lastReadMessageId);

        const firstUnreadMessage = messagesToArray.find((message, index) => {
            const messageIsAfterLastSeenMessage = index > previousIndex;

            return !this._isMessageVisible(message) && messageIsAfterLastSeenMessage;
        });

        return firstUnreadMessage;
    }

    _isMessageVisible: () => boolean;

    /**
     * Check if a message is visible in view.
     *
     * @param {HtmlElement} message -
     *
     * @returns {void}
     */
    _isMessageVisible(message) {
        const { bottom, height, top } = message.getBoundingClientRect();
        const containerRect = this._messageListRef.current.getBoundingClientRect();

        return top <= containerRect.top ? containerRect.top - top <= height : bottom - containerRect.bottom <= height;
    }
}

export default MessageContainer;
