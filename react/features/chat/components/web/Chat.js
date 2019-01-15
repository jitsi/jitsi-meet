// @flow

import React from 'react';
import { connect } from 'react-redux';
import Transition from 'react-transition-group/Transition';

import { translate } from '../../../base/i18n';

import AbstractChat, {
    _mapDispatchToProps,
    _mapStateToProps,
    type Props
} from '../AbstractChat';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
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
        this._renderMessage = this._renderMessage.bind(this);
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
     * Returns a React Element for showing chat messages and a form to send new
     * chat messages.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderChat() {
        const messages = this.props._messages.map(this._renderMessage);

        messages.push(<div
            key = 'end-marker'
            ref = { this._setMessageListEndRef } />);

        return (
            <div
                className = 'sideToolbarContainer__inner'
                id = 'chat_container'>
                <div id = 'chatconversation'>
                    { messages }
                </div>
                <ChatInput />
            </div>
        );
    }

    _renderMessage: (Object) => void;

    /**
     * Called by {@code _onSubmitMessage} to create the chat div.
     *
     * @param {string} message - The chat message to display.
     * @param {string} id - The chat message ID to use as a unique key.
     * @returns {Array<ReactElement>}
     */
    _renderMessage(message: Object, id: string) {
        return (
            <ChatMessage
                key = { id }
                message = { message } />
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

        const { _isOpen, _onToggleChat, _showNamePrompt } = this.props;
        const ComponentToRender = !_isOpen && state === 'exited'
            ? null
            : (
                <div>
                    <div
                        className = 'chat-close'
                        onClick = { _onToggleChat }>X</div>
                    { _showNamePrompt
                        ? <DisplayNameForm /> : this._renderChat() }
                </div>
            );
        let className = '';

        if (_isOpen) {
            className = 'slideInExt';
        } else if (this._isExited) {
            className = 'invisible';
        }

        return (
            <div
                className = { className }
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
