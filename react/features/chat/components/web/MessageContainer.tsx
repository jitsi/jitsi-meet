import throttle from 'lodash/throttle';
import React, { RefObject } from 'react';
import { scrollIntoView } from 'seamless-scroll-polyfill';

import { MESSAGE_TYPE_REMOTE } from '../../constants';
import AbstractMessageContainer, { IProps } from '../AbstractMessageContainer';

import ChatMessageGroup from './ChatMessageGroup';
import NewMessagesButton from './NewMessagesButton';

interface IState {

    /**
     * Whether or not message container has received new messages.
     */
    hasNewMessages: boolean;

    /**
     * Whether or not scroll position is at the bottom of container.
     */
    isScrolledToBottom: boolean;

    /**
     * The id of the last read message.
     */
    lastReadMessageId: string;
}

/**
 * Displays all received chat messages, grouped by sender.
 *
 * @augments AbstractMessageContainer
 */
export default class MessageContainer extends AbstractMessageContainer<IProps, IState> {
    /**
     * Component state used to decide when the hasNewMessages button to appear
     * and where to scroll when click on hasNewMessages button.
     */
    state: IState = {
        hasNewMessages: false,
        isScrolledToBottom: true,
        lastReadMessageId: ''
    };

    /**
     * Reference to the HTML element at the end of the list of displayed chat
     * messages. Used for scrolling to the end of the chat messages.
     */
    _messagesListEndRef: RefObject<HTMLDivElement>;

    /**
     * A React ref to the HTML element containing all {@code ChatMessageGroup}
     * instances.
     */
    _messageListRef: RefObject<HTMLDivElement>;

    /**
     * Intersection observer used to detect intersections of messages with the bottom of the message container.
     */
    _bottomListObserver: IntersectionObserver;

    /**
     * Initializes a new {@code MessageContainer} instance.
     *
     * @param {IProps} props - The React {@code Component} props to initialize
     * the new {@code MessageContainer} instance with.
     */
    constructor(props: IProps) {
        super(props);

        this._messageListRef = React.createRef<HTMLDivElement>();
        this._messagesListEndRef = React.createRef<HTMLDivElement>();

        // Bind event handlers so they are only bound once for every instance.
        this._handleIntersectBottomList = this._handleIntersectBottomList.bind(this);
        this._findFirstUnreadMessage = this._findFirstUnreadMessage.bind(this);
        this._isMessageVisible = this._isMessageVisible.bind(this);
        this._onChatScroll = throttle(this._onChatScroll.bind(this), 300, { leading: true });
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
            const messageType = group[0]?.messageType;

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
     * Implements {@code Component#componentDidMount}.
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
     * If the user receive a new message scroll automatically to the bottom if scroll position was at the bottom.
     * Otherwise update hasNewMessages from component state.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidUpdate(prevProps: IProps) {
        const hasNewMessages = this.props.messages.length !== prevProps.messages.length;

        if (hasNewMessages) {
            if (this.state.isScrolledToBottom) {
                this.scrollToElement(false, null);
            } else {
                // eslint-disable-next-line react/no-did-update-set-state
                this.setState({ hasNewMessages: true });
            }
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

        this._bottomListObserver.unobserve(target as Element);
    }

    /**
     * Automatically scrolls the displayed chat messages to bottom or to a specific element if it is provided.
     *
     * @param {boolean} withAnimation - Whether or not to show a scrolling.
     * @param {TMLElement} element - Where to scroll.
     * Animation.
     * @returns {void}
     */
    scrollToElement(withAnimation: boolean, element: Element | null) {
        const scrollTo = element ? element : this._messagesListEndRef.current;
        const block = element ? 'center' : 'nearest';

        scrollIntoView(scrollTo as Element, {
            behavior: withAnimation ? 'smooth' : 'auto',
            block
        });
    }


    /**
     * Callback invoked to listen to current scroll position and update next unread message.
     * The callback is invoked inside a throttle with 300 ms to decrease the number of function calls.
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
     * Find the first unread message.
     * Update component state and scroll to element.
     *
     * @private
     * @returns {void}
     */
    _onGoToFirstUnreadMessage() {
        const firstUnreadMessage = this._findFirstUnreadMessage();

        this.setState({ lastReadMessageId: firstUnreadMessage?.id || null });
        this.scrollToElement(true, firstUnreadMessage as Element);
    }

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

    /** .
    * _HandleIntersectBottomList.
    * When entry is intersecting with bottom of container set last message as last read message.
    * When entry is not intersecting update only isScrolledToBottom with false value.
    *
    * @param {Array} entries - List of entries.
    * @private
    * @returns {void}
    */
    _handleIntersectBottomList(entries: IntersectionObserverEntry[]) {
        entries.forEach((entry: IntersectionObserverEntry) => {
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

    /**
    * Find first unread message.
    * MessageIsAfterLastSeenMessage filter elements which are not visible but are before the last read message.
    *
    * @private
    * @returns {Element}
    */
    _findFirstUnreadMessage() {
        const messagesNodeList = document.querySelectorAll('.chatmessage-wrapper');

        // @ts-ignore
        const messagesToArray = [ ...messagesNodeList ];

        const previousIndex = messagesToArray.findIndex((message: Element) =>
            message.id === this.state.lastReadMessageId);

        if (previousIndex !== -1) {
            for (let i = previousIndex; i < messagesToArray.length; i++) {
                if (!this._isMessageVisible(messagesToArray[i])) {
                    return messagesToArray[i];
                }
            }
        }
    }

    /**
     * Check if a message is visible in view.
     *
     * @param {Element} message -
     *
     * @returns {boolean}
     */
    _isMessageVisible(message: Element): boolean {
        const { bottom, height, top } = message.getBoundingClientRect();

        if (this._messageListRef.current) {
            const containerRect = this._messageListRef.current.getBoundingClientRect();

            return top <= containerRect.top
                ? containerRect.top - top <= height : bottom - containerRect.bottom <= height;
        }

        return false;
    }
}
