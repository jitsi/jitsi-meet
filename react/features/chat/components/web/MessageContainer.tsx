import { DebouncedFunc, throttle } from 'lodash-es';
import React, { Component, RefObject } from 'react';
import { scrollIntoView } from 'seamless-scroll-polyfill';

import { groupMessagesBySender } from '../../../base/util/messageGrouping';
import { MESSAGE_TYPE_LOCAL, MESSAGE_TYPE_REMOTE } from '../../constants';
import { IMessage } from '../../types';


import ChatMessageGroup from './ChatMessageGroup';
import NewMessagesButton from './NewMessagesButton';

interface IProps {

    editingMessage?: IMessage;
    /**
     * Whether the message container is currently visible to the user.
     * Defaults to true when not provided.
     */
    isVisible?: boolean;
    messages: IMessage[];
    onCancelEdit?: () => void;
    /**
     * Callback invoked when the user wants to edit a message.
     */
    onEditMessage?: (message: IMessage) => void;
}

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
    lastReadMessageId: string | null;
}

/**
 * Displays all received chat messages, grouped by sender.
 *
 * @augments Component
 */
export default class MessageContainer extends Component<IProps, IState> {
    /**
     * Component state used to decide when the hasNewMessages button to appear
     * and where to scroll when click on hasNewMessages button.
     */
    override state: IState = {
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
     * Whether the component has performed its initial scroll to the bottom.
     * Used to ensure we scroll on first visibility but preserve scroll position on subsequent tab switches.
     */
    _hasInitiallyScrolled: boolean;

    /**
     * Throttled scroll handler; typed as {@code DebouncedFunc} so unmount can cancel a pending trailing call.
     */
    _onChatScroll: DebouncedFunc<() => void>;

    static defaultProps = {
        isVisible: true,
        messages: [] as IMessage[]
    };

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
        this._hasInitiallyScrolled = false;

        // Bind event handlers so they are only bound once for every instance.
        this._handleIntersectBottomList = this._handleIntersectBottomList.bind(this);
        this._findFirstUnreadMessage = this._findFirstUnreadMessage.bind(this);
        this._onChatScroll = throttle(this._handleChatScroll.bind(this), 300, { leading: true });
        this._onGoToFirstUnreadMessage = this._onGoToFirstUnreadMessage.bind(this);
    }

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    override render() {
        const groupedMessages = this._getMessagesGroupedBySender();
        const content = groupedMessages.map((group, index) => {
            const { messages } = group;
            const messageType = messages[0]?.messageType;

            return (
                <ChatMessageGroup
                    className = { messageType || MESSAGE_TYPE_REMOTE }
                    editingMessage = { this.props.editingMessage }
                    key = { index }
                    messages = { messages }
                    onCancelEdit = { this.props.onCancelEdit }
                    onEditMessage = { this.props.onEditMessage } />
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
                    { content }

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
    override componentDidMount() {
        // Only scroll on mount if the component is visible, since scrollIntoView
        // silently does nothing on hidden (display: none) elements. If hidden,
        // componentDidUpdate will handle scrolling when the component first becomes visible.
        if (this.props.isVisible) {
            this._hasInitiallyScrolled = true;
            requestAnimationFrame(() => {
                this.scrollToElement(false, null);
            });
        }

        this._createBottomListObserver();
    }

    /**
     * Implements {@code Component#componentDidUpdate}.
     * If the user receive a new message or the local user send a new message,
     * scroll automatically to the bottom if scroll position was at the bottom.
     * Otherwise update hasNewMessages from component state.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentDidUpdate(prevProps: IProps) {
        const newMessages = this.props.messages.filter(message => !prevProps.messages.includes(message));
        const hasLocalMessage = newMessages.map(message => message.messageType).includes(MESSAGE_TYPE_LOCAL);

        if (newMessages.length > 0) {
            if (this.state.isScrolledToBottom || hasLocalMessage) {
                this.scrollToElement(false, null);
            } else {
                // eslint-disable-next-line react/no-did-update-set-state
                this.setState({ hasNewMessages: true });
            }
        }

        // If the component was mounted while hidden, scrollIntoView was skipped.
        // Scroll to the bottom the first time it becomes visible to show the latest messages.
        if (this.props.isVisible && !prevProps.isVisible && !this._hasInitiallyScrolled) {
            this._hasInitiallyScrolled = true;
            requestAnimationFrame(() => {
                this.scrollToElement(false, null);
            });
        }
    }

    /**
     * Implements React's {@link Component#componentWillUnmount()}. Invoked
     * immediately before this component is unmounted and destroyed.
     *
     * @inheritdoc
     */
    override componentWillUnmount() {
        const target = document.querySelector('#messagesListEnd');

        this._bottomListObserver.unobserve(target as Element);

        // Drop any trailing throttled call so it does not setState or query the DOM post-unmount.
        this._onChatScroll.cancel();
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
     * Dismisses the new-messages pill once the first unread message has scrolled into view.
     *
     * @private
     * @returns {void}
     */
    _handleChatScroll() {
        const container = this._messageListRef.current;

        if (!this.state.hasNewMessages || !container) {
            return;
        }

        const firstUnreadMessage = this._findFirstUnreadMessage();

        // Still below the viewport: the user has not reached the new messages yet.
        if (firstUnreadMessage
                && firstUnreadMessage.getBoundingClientRect().top >= container.getBoundingClientRect().bottom) {
            return;
        }

        this.setState({
            hasNewMessages: false,
            lastReadMessageId: this.props.messages.at(-1)?.messageId ?? null
        });
    }

    /**
     * Scrolls to the first unread message.
     *
     * @private
     * @returns {void}
     */
    _onGoToFirstUnreadMessage() {
        this.scrollToElement(true, this._findFirstUnreadMessage());
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
     * Returns the element of the first message after the last read one, or null if there is none.
     *
     * @private
     * @returns {Element|null}
     */
    _findFirstUnreadMessage(): Element | null {
        const { messages } = this.props;

        // An unknown last-read id yields index -1, so every message counts as unread.
        const firstUnread = messages[messages.findIndex(m => m.messageId === this.state.lastReadMessageId) + 1];

        if (!firstUnread?.messageId) {
            return null;
        }

        return this._messageListRef.current?.querySelector(`#${CSS.escape(firstUnread.messageId)}`) ?? null;
    }

    /**
     * Returns an array of message groups, where each group is an array of messages
     * grouped by the sender.
     *
     * @returns {Array<Array<Object>>}
     */
    _getMessagesGroupedBySender() {
        return groupMessagesBySender(this.props.messages);
    }
}
