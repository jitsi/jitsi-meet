// @flow

import React, { PureComponent } from 'react';

import ChatMessageGroup from './ChatMessageGroup';

type Props = {

    /**
     * The messages array to render.
     */
    messages: Array<Object>
}

/**
 * Displays all received chat messages, grouped by sender.
 *
 * @extends PureComponent
 */
export default class MessageContainer extends PureComponent<Props> {
    static defaultProps = {
        messages: []
    };

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
     * Implements React's {@link Component#componentDidMount()}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._scrollMessagesToBottom();
    }

    /**
     * Updates chat input focus.
     *
     * @inheritdoc
     */
    componentDidUpdate() {
        this._scrollMessagesToBottom();
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
     * Iterates over all the messages and creates nested arrays which hold
     * consecutive messages sent by the same participant.
     *
     * @private
     * @returns {Array<Array<Object>>}
     */
    _getMessagesGroupedBySender() {
        const messagesCount = this.props.messages.length;
        const groups = [];
        let currentGrouping = [];
        let currentGroupParticipantId;

        for (let i = 0; i < messagesCount; i++) {
            const message = this.props.messages[i];

            if (message.id === currentGroupParticipantId) {
                currentGrouping.push(message);
            } else {
                groups.push(currentGrouping);

                currentGrouping = [ message ];
                currentGroupParticipantId = message.id;
            }
        }

        groups.push(currentGrouping);

        return groups;
    }

    /**
     * Automatically scrolls the displayed chat messages down to the latest.
     *
     * @private
     * @returns {void}
     */
    _scrollMessagesToBottom() {
        this._messagesListEndRef.current.scrollIntoView({
            behavior: 'smooth'
        });
    }
}
