// @flow

import React from 'react';

import AbstractMessageContainer, { type Props }
    from '../AbstractMessageContainer';

import ChatMessageGroup from './ChatMessageGroup';

/**
 * Displays all received chat messages, grouped by sender.
 *
 * @extends AbstractMessageContainer
 */
export default class MessageContainer extends AbstractMessageContainer {
    /**
     * Reference to the HTML element at the end of the list of displayed chat
     * messages. Used for scrolling to the end of the chat messages.
     */
    _messagesListEndRef: Object;

    /**
     * Initializes a new {@code MessageContainer} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code MessageContainer} instance with.
     */
    constructor(props: Props) {
        super(props);

        this._messagesListEndRef = React.createRef();
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
                    className = { messageType || 'remote' }
                    key = { index }
                    messages = { group } />
            );
        });

        return (
            <div id = 'chatconversation'>
                { messages }
                <div ref = { this._messagesListEndRef } />
            </div>
        );
    }

    /**
     * Automatically scrolls the displayed chat messages down to the latest.
     *
     * @param {boolean} withAnimation - Whether or not to show a scrolling
     * animation.
     * @returns {void}
     */
    scrollToBottom(withAnimation: boolean) {
        this._messagesListEndRef.current.scrollIntoView({
            behavior: withAnimation ? 'smooth' : 'auto'
        });
    }

    _getMessagesGroupedBySender: () => Array<Array<Object>>;
}
