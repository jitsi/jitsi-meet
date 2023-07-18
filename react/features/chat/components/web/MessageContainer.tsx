import throttle from 'lodash/throttle';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { scrollIntoView } from 'seamless-scroll-polyfill';

import { MESSAGE_TYPE_REMOTE } from '../../constants';
import { getMessagesGroupedBySender } from '../../functions';
import { IMessage } from '../../types';

import ChatMessageGroup from './ChatMessageGroup';
import NewMessagesButton from './NewMessagesButton';

interface IProps {

    /**
     * The messages array to render.
     */
    messages: IMessage[];
}

/**
 * Displays all received chat messages, grouped by sender.
 *
 * @param {IProps} props - Component's props.
 * @returns {JSX}
 */
const MessageContainer = (props: IProps) => {
    const [ hasNewMessages, setHasNewMessages ] = useState(false);
    const [ isScrolledToBottom, setIsScrolledToBottom ] = useState(false);
    const [ lastReadMessageId, setLastReadMessageId ] = useState('');
    const prevMessages = useRef(props.messages);

    /**
     * Reference to the HTML element at the end of the list of displayed chat
     * messages. Used for scrolling to the end of the chat messages.
     */
    const messagesListEndRef = useRef<HTMLDivElement>(null);

    /**
     * A React ref to the HTML element containing all {@code ChatMessageGroup}
     * instances.
     */
    const messageListRef = useRef<HTMLDivElement>(null);

    /**
    * Intersection observer used to detect intersections of messages with the bottom of the message container.
    */
    const bottomListObserver = useRef<IntersectionObserver>();

    useEffect(() => {
        scrollToElement(false, null);
        createBottomListObserver();

        return () => {
            const target = document.querySelector('#messagesListEnd');

            bottomListObserver.current?.unobserve(target as Element);
        };
    }, []);

    useEffect(() => {
        const newMessages = props.messages.length !== prevMessages.current.length;

        if (newMessages) {
            if (isScrolledToBottom) {
                scrollToElement(false, null);
            } else {
                setHasNewMessages(true);
            }
        }
        prevMessages.current = props.messages;
    }, [ props.messages, isScrolledToBottom ]);

    /**
     * Automatically scrolls the displayed chat messages to bottom or to a specific element if it is provided.
     *
     * @param {boolean} withAnimation - Whether or not to show a scrolling.
     * @param {TMLElement} element - Where to scroll.
     * Animation.
     * @returns {void}
     */
    function scrollToElement(withAnimation: boolean, element: Element | null) {
        const scrollTo = element ? element : messagesListEndRef.current;
        const block = element ? 'center' : 'nearest';

        scrollIntoView(scrollTo as Element, {
            behavior: withAnimation ? 'smooth' : 'auto',
            block
        });
    }

    /**
    * Find first unread message.
    * MessageIsAfterLastSeenMessage filter elements which are not visible but are before the last read message.
    *
    * @returns {Element}
    */
    const findFirstUnreadMessage = useCallback(() => {
        const messagesNodeList = document.querySelectorAll('.chatmessage-wrapper');

        // @ts-ignore
        const messagesToArray = [ ...messagesNodeList ];

        const previousIndex = messagesToArray.findIndex((message: Element) =>
            message.id === lastReadMessageId);

        if (previousIndex !== -1) {
            for (let i = previousIndex; i < messagesToArray.length; i++) {
                if (!isMessageVisible(messagesToArray[i])) {
                    return messagesToArray[i];
                }
            }
        }
    }, [ lastReadMessageId ]);

    /**
     * Callback invoked to listen to current scroll position and update next unread message.
     * The callback is invoked inside a throttle with 300 ms to decrease the number of function calls.
     *
     * @returns {void}
     */
    const onChatScroll = useCallback(() => {
        const firstUnreadMessage = findFirstUnreadMessage();

        if (firstUnreadMessage && firstUnreadMessage.id !== lastReadMessageId) {
            setLastReadMessageId(firstUnreadMessage?.id);
        }
    }, [ findFirstUnreadMessage ]);

    /**
     * Find the first unread message.
     * Update component state and scroll to element.
     *
     * @returns {void}
     */
    const onGoToFirstUnreadMessage = useCallback(() => {
        const firstUnreadMessage = findFirstUnreadMessage();

        setLastReadMessageId(firstUnreadMessage?.id || null);
        scrollToElement(true, firstUnreadMessage as Element);
    }, [ findFirstUnreadMessage ]);

    /**
    * Create observer to react when scroll position is at bottom or leave the bottom.
    *
    * @returns {void}
    */
    function createBottomListObserver() {
        const options = {
            root: document.querySelector('#chatconversation'),
            rootMargin: '35px',
            threshold: 0.5
        };

        const target = document.querySelector('#messagesListEnd');

        if (target) {
            bottomListObserver.current = new IntersectionObserver(handleIntersectBottomList, options);
            bottomListObserver.current.observe(target);
        }
    }

    /** .
    * _HandleIntersectBottomList.
    * When entry is intersecting with bottom of container set last message as last read message.
    * When entry is not intersecting update only isScrolledToBottom with false value.
    *
    * @param {Array} entries - List of entries.
    * @returns {void}
    */
    function handleIntersectBottomList(entries: IntersectionObserverEntry[]) {
        entries.forEach((entry: IntersectionObserverEntry) => {
            if (entry.isIntersecting && props.messages.length) {
                const lastMessageIndex = props.messages.length - 1;
                const lastMessage = props.messages[lastMessageIndex];
                const lastReadMessage = lastMessage.messageId;

                setIsScrolledToBottom(true);
                setHasNewMessages(false);
                setLastReadMessageId(lastReadMessage);
            }

            if (!entry.isIntersecting) {
                setIsScrolledToBottom(false);
            }
        });
    }

    /**
     * Check if a message is visible in view.
     *
     * @param {Element} message -
     * @returns {boolean}
     */
    function isMessageVisible(message: Element): boolean {
        const { bottom, height, top } = message.getBoundingClientRect();

        if (messageListRef.current) {
            const containerRect = messageListRef.current.getBoundingClientRect();

            return top <= containerRect.top
                ? containerRect.top - top <= height : bottom - containerRect.bottom <= height;
        }

        return false;
    }

    const _onChatScroll = useRef(throttle(onChatScroll, 300, { leading: true }));

    useEffect(() => {
        _onChatScroll.current = throttle(onChatScroll, 300, { leading: true });
    }, [ onChatScroll ]);

    const groupedMessages = useMemo(() => getMessagesGroupedBySender(props.messages), [ props.messages ]);

    return (
        <div id = 'chat-conversation-container'>
            <div
                aria-labelledby = 'chat-header'
                id = 'chatconversation'
                onScroll = { _onChatScroll.current }
                ref = { messageListRef }
                role = 'log'
                tabIndex = { 0 }>
                {groupedMessages.map((group, index) => {
                    const messageType = group[0]?.messageType;

                    return (
                        <ChatMessageGroup
                            className = { messageType || MESSAGE_TYPE_REMOTE }
                            key = { index }
                            messages = { group } />
                    );
                })}

                {!isScrolledToBottom && hasNewMessages
                    && <NewMessagesButton
                        onGoToFirstUnreadMessage = { onGoToFirstUnreadMessage } />}
                <div
                    id = 'messagesListEnd'
                    ref = { messagesListEndRef } />
            </div>
        </div>
    );
};

export default MessageContainer;

