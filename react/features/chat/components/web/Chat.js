// @flow

import React from 'react';
import Transition from 'react-transition-group/Transition';

import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';

import AbstractChat, {
    _mapDispatchToProps,
    _mapStateToProps,
    type Props
} from '../AbstractChat';
import ChatInput from './ChatInput';
import ChatMessageGroup from './ChatMessageGroup';
import DisplayNameForm from './DisplayNameForm';

/**
 * React Component for holding the chat feature in a side panel that slides in
 * and out of view.
 */
class Chat extends AbstractChat<Props> {

    /**
     * Whether or not the {@code Chat} component is off-screen, having finished
     * its hiding animation.
     */
    _isExited: boolean;

    /**
     * Reference to the HTML element at the end of the list of displayed chat
     * messages. Used for scrolling to the end of the chat messages.
     */
    _messagesListEnd: ?HTMLElement;

    /**
     * Initializes a new {@code Chat} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this._isExited = true;
        this._messagesListEnd = null;

        // Bind event handlers so they are only bound once for every instance.
        this._renderPanelContent = this._renderPanelContent.bind(this);
        this._setMessageListEndRef = this._setMessageListEndRef.bind(this);
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
    componentDidUpdate(prevProps) {
        if (this.props._messages !== prevProps._messages) {
            this._scrollMessagesToBottom();

        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Transition
                in = { this.props._isOpen }
                timeout = { 500 }>
                { this._renderPanelContent }
            </Transition>
        );
    }

    /**
     * Iterates over all the messages and creates nested arrays which hold
     * consecutive messages sent be the same participant.
     *
     * @private
     * @returns {Array<Array<Object>>}
     */
    _getMessagesGroupedBySender() {
        const messagesCount = this.props._messages.length;
        const groups = [];
        let currentGrouping = [];
        let currentGroupParticipantId;

        for (let i = 0; i < messagesCount; i++) {
            const message = this.props._messages[i];

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
     * Returns a React Element for showing chat messages and a form to send new
     * chat messages.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderChat() {
        const groupedMessages = this._getMessagesGroupedBySender();

        const messages = groupedMessages.map((group, index) => {
            const messageType = group[0] && group[0].messageType;
            let className = 'remote';

            if (messageType === 'local') {
                className = 'local';
            } else if (messageType === 'error') {
                className = 'error';
            }

            return (
                <ChatMessageGroup
                    className = { className }
                    key = { index }
                    messages = { group } />
            );
        });

        messages.push(<div
            key = 'end-marker'
            ref = { this._setMessageListEndRef } />);

        return (
            <>
                <div id = 'chatconversation'>
                    { messages }
                </div>
                <ChatInput />
            </>
        );
    }

    /**
     * Instantiates a React Element to display at the top of {@code Chat} to
     * close {@code Chat}.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderChatHeader() {
        return (
            <div className = 'chat-header'>
                <div
                    className = 'chat-close'
                    onClick = { this.props._onToggleChat }>X</div>
            </div>
        );
    }

    _renderPanelContent: (string) => React$Node | null;

    /**
     * Renders the contents of the chat panel, depending on the current
     * animation state provided by {@code Transition}.
     *
     * @param {string} state - The current display transition state of the
     * {@code Chat} component, as provided by {@code Transition}.
     * @private
     * @returns {ReactElement | null}
     */
    _renderPanelContent(state) {
        this._isExited = state === 'exited';

        const { _isOpen, _showNamePrompt } = this.props;
        const ComponentToRender = !_isOpen && state === 'exited'
            ? null
            : (
                <>
                    { this._renderChatHeader() }
                    { _showNamePrompt
                        ? <DisplayNameForm /> : this._renderChat() }
                </>
            );
        let className = '';

        if (_isOpen) {
            className = 'slideInExt';
        } else if (this._isExited) {
            className = 'invisible';
        }

        return (
            <div
                className = { `sideToolbarContainer ${className}` }
                id = 'sideToolbarContainer'>
                { ComponentToRender }
            </div>
        );
    }

    /**
     * Automatically scrolls the displayed chat messages down to the latest.
     *
     * @private
     * @returns {void}
     */
    _scrollMessagesToBottom() {
        if (this._messagesListEnd) {
            this._messagesListEnd.scrollIntoView({
                behavior: this._isExited ? 'auto' : 'smooth'
            });
        }
    }

    _setMessageListEndRef: (?HTMLElement) => void;

    /**
     * Sets a reference to the HTML element at the bottom of the message list.
     *
     * @param {Object} messageListEnd - The HTML element.
     * @private
     * @returns {void}
     */
    _setMessageListEndRef(messageListEnd: ?HTMLElement) {
        this._messagesListEnd = messageListEnd;
    }
}

export default translate(connect(_mapStateToProps, _mapDispatchToProps)(Chat));
