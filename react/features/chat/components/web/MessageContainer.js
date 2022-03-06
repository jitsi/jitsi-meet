// @flow

import { withStyles } from '@material-ui/core/styles';
import React from 'react';

import { MESSAGE_TYPE_REMOTE } from '../../constants';
import AbstractMessageContainer, { type Props as AbstractProps }
    from '../AbstractMessageContainer';

import ChatMessageGroup from './ChatMessageGroup';

type Props = AbstractProps & {

    /**
     * An object containing the CSS classes.
     */
    classes: Object,
}

/**
 * Creates the styles for the component.
 *
 * @returns {Object}
 */
const styles = () => {
    return {
        root: {
            flip: false,
            boxSizing: 'border-box',
            flex: '1',
            fontSize: '10pt',
            height: 'calc(100% - 68px)',
            lineHeight: '20px',
            overflow: 'auto',
            padding: '16px',
            textAlign: 'left',
            wordWrap: 'break-word',
            display: 'flex',
            flexDirection: 'column',

            '& > :first-child': {
                marginTop: 'auto'
            },
            '& a': {
                display: 'block'
            },
            '& a:link': {
                color: '#b8b8b8'
            },
            '& a:visited': {
                color: 'white'
            },
            '& a:hover': {
                color: '#d5d5d5'
            },
            '& a:active': {
                color: 'black'
            }
        }
    };
};

/**
 * Displays all received chat messages, grouped by sender.
 *
 * @augments AbstractMessageContainer
 */
class MessageContainer extends AbstractMessageContainer<Props> {
    /**
     * Whether or not chat has been scrolled to the bottom of the screen. Used
     * to determine if chat should be scrolled automatically to the bottom when
     * the {@code ChatInput} resizes.
     */
    _isScrolledToBottom: boolean;

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
     * Initializes a new {@code MessageContainer} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code MessageContainer} instance with.
     */
    constructor(props: Props) {
        super(props);

        this._isScrolledToBottom = true;

        this._messageListRef = React.createRef();
        this._messagesListEndRef = React.createRef();

        this._onChatScroll = this._onChatScroll.bind(this);
    }

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { classes } = this.props;
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
            <div
                aria-labelledby = 'chat-header'
                className = { classes.root }
                id = 'chatconversation'
                onScroll = { this._onChatScroll }
                ref = { this._messageListRef }
                role = 'log'
                tabIndex = { 0 }>
                { messages }
                <div ref = { this._messagesListEndRef } />
            </div>
        );
    }

    /**
     * Scrolls to the bottom again if the instance had previously been scrolled
     * to the bottom. This method is used when a resize has occurred below the
     * instance and bottom scroll needs to be maintained.
     *
     * @returns {void}
     */
    maybeUpdateBottomScroll() {
        if (this._isScrolledToBottom) {
            this.scrollToBottom(false);
        }
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
            behavior: withAnimation ? 'smooth' : 'auto',
            block: 'nearest'
        });
    }

    _getMessagesGroupedBySender: () => Array<Array<Object>>;

    _onChatScroll: () => void;

    /**
     * Callback invoked to listen to the current scroll location.
     *
     * @private
     * @returns {void}
     */
    _onChatScroll() {
        const element = this._messageListRef.current;

        this._isScrolledToBottom
            = element.scrollHeight - element.scrollTop === element.clientHeight;
    }
}

export default withStyles(styles)(MessageContainer);
