import React, { useCallback, useEffect, useRef, useState } from 'react';
import { scrollIntoView } from 'seamless-scroll-polyfill';
import { makeStyles } from 'tss-react/mui';

import { ISubtitle } from '../../../subtitles/types';

import NewMessagesButton from './NewMessagesButton';
import { SubtitlesGroup } from './SubtitlesGroup';

interface IProps {
    groups: Array<{
        messages: ISubtitle[];
        senderId: string;
    }>;
    messages: ISubtitle[];
}

/**
 * The padding value used for the message list.
 *
 * @constant {string}
 */
const MESSAGE_LIST_PADDING = '16px';

const useStyles = makeStyles()(() => {
    return {
        container: {
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
            height: '100%'
        },
        messagesList: {
            height: '100%',
            overflowY: 'auto',
            padding: MESSAGE_LIST_PADDING,
            boxSizing: 'border-box'
        }
    };
});

/**
 * Component that handles the display and scrolling behavior of subtitles messages.
 * It provides auto-scrolling for new messages and a button to jump to new messages
 * when the user has scrolled up.
 *
 * @returns {JSX.Element} - A React component displaying subtitles messages with scroll functionality.
 */
export function SubtitlesMessagesContainer({ messages, groups }: IProps) {
    const { classes } = useStyles();
    const [ hasNewMessages, setHasNewMessages ] = useState(false);
    const [ isScrolledToBottom, setIsScrolledToBottom ] = useState(true);
    const [ observer, setObserver ] = useState<IntersectionObserver | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToElement = useCallback((withAnimation: boolean, element: Element | null) => {
        const scrollTo = element ? element : messagesEndRef.current;
        const block = element ? 'end' : 'nearest';

        scrollIntoView(scrollTo as Element, {
            behavior: withAnimation ? 'smooth' : 'auto',
            block
        });
    }, [ messagesEndRef.current ]);

    const handleNewMessagesClick = useCallback(() => {
        scrollToElement(true, null);
    }, [ scrollToElement ]);

    const handleIntersectBottomList = (entries: IntersectionObserverEntry[]) => {
        entries.forEach((entry: IntersectionObserverEntry) => {
            if (entry.isIntersecting) {
                setIsScrolledToBottom(true);
                setHasNewMessages(false);
            }

            if (!entry.isIntersecting) {
                setIsScrolledToBottom(false);
            }
        });
    };

    const createBottomListObserver = () => {
        const target = document.querySelector('#subtitles-messages-end');

        if (target) {
            const newObserver = new IntersectionObserver(
                handleIntersectBottomList, {
                    root: document.querySelector('#subtitles-messages-list'),
                    rootMargin: MESSAGE_LIST_PADDING,
                    threshold: 1
                });

            setObserver(newObserver);
            newObserver.observe(target);
        }
    };

    useEffect(() => {
        scrollToElement(false, null);
        createBottomListObserver();

        return () => {
            if (observer) {
                observer.disconnect();
                setObserver(null);
            }
        };
    }, []);

    const previousMessages = useRef(messages);

    useEffect(() => {
        const newMessages = messages.filter(message => !previousMessages.current.includes(message));

        if (newMessages.length > 0) {
            if (isScrolledToBottom) {
                scrollToElement(false, null);
            } else {
                setHasNewMessages(true);
            }
        }

        previousMessages.current = messages;
    },

    // isScrolledToBottom is not a dependency because we neither need to show the new messages button neither scroll to the
    // bottom when the user has scrolled up.
    [ messages, scrollToElement ]);

    return (
        <div
            className = { classes.container }
            id = 'subtitles-messages-container'>
            <div
                className = { classes.messagesList }
                id = 'subtitles-messages-list'>
                {groups.map(group => (
                    <SubtitlesGroup
                        key = { `${group.senderId}-${group.messages[0].timestamp}` }
                        messages = { group.messages }
                        senderId = { group.senderId } />
                ))}
                { !isScrolledToBottom && hasNewMessages && (
                    <NewMessagesButton
                        onGoToFirstUnreadMessage = { handleNewMessagesClick } />
                )}
                <div
                    id = 'subtitles-messages-end'
                    ref = { messagesEndRef } />
            </div>
        </div>
    );
}
