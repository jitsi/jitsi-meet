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
            padding: '16px',
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
        const block = element ? 'center' : 'nearest';

        scrollIntoView(scrollTo as Element, {
            behavior: withAnimation ? 'smooth' : 'auto',
            block
        });
    }, [ messagesEndRef ]);

    /**
     * Handle click on the "new messages" button.
     */
    const handleNewMessagesClick = useCallback(() => {
        scrollToElement(true, null);
    }, [ scrollToElement ]);

    const handleIntersectBottomList = useCallback((entries: IntersectionObserverEntry[]) => {
        entries.forEach((entry: IntersectionObserverEntry) => {
            if (entry.isIntersecting && messages.length) {
                setIsScrolledToBottom(true);
                setHasNewMessages(false);
            }

            if (!entry.isIntersecting) {
                setIsScrolledToBottom(false);
            }
        });
    }, [ messages, setIsScrolledToBottom, setHasNewMessages ]);

    const createBottomListObserver = useCallback(() => {
        const options = {
            root: document.querySelector('#subtitles-messages-container'),
            rootMargin: '35px',
            threshold: 0.5
        };

        const target = document.querySelector('#subtitles-messages-end');

        if (target) {
            const newObserver = new IntersectionObserver(handleIntersectBottomList, options);

            setObserver(newObserver);
            newObserver.observe(target);
        }
    }, []);

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
    }, [ messages, isScrolledToBottom, scrollToElement, setHasNewMessages ]);

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
                <div
                    id = 'subtitles-messages-end'
                    ref = { messagesEndRef } />

                { !isScrolledToBottom && hasNewMessages && (
                    <NewMessagesButton
                        onGoToFirstUnreadMessage = { handleNewMessagesClick } />
                )}
            </div>
        </div>
    );
}
