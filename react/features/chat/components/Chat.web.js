// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import Transition from 'react-transition-group/Transition';

import { translate } from '../../base/i18n';
import { getLocalParticipant } from '../../base/participants';

import { toggleChat } from '../actions';

import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import DisplayNameForm from './DisplayNameForm';

/**
 * The type of the React {@code Component} props of {@link Chat}.
 */
type Props = {

    /**
     * The JitsiConference instance to send messages to.
     */
    _conference: Object,

    /**
     * Whether or not chat is displayed.
     */
    _isOpen: Boolean,

    /**
     * The local participant's ID.
     */
    _localUserId: String,

    /**
     * All the chat messages in the conference.
     */
    _messages: Array<Object>,

    /**
     * Whether or not to block chat access with a nickname input form.
     */
    _showNamePrompt: boolean,

    /**
     * Invoked to change the chat panel status.
     */
    dispatch: Dispatch<*>
};

/**
 * The type of the React {@code Component} state of {@Chat}.
 */
type State = {

    /**
     * User provided nickname when the input text is provided in the view.
     *
     * @type {String}
     */
    message: string
};

/**
 * React Component for holding the chat feature in a side panel that slides in
 * and out of view.
 *
 * @extends Component
 */
class Chat extends Component<Props, State> {

    /**
     * Reference to the HTML element used for typing in a chat message.
     */
    _chatInput: ?HTMLElement;

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

        this._chatInput = null;
        this._isExited = true;
        this._messagesListEnd = null;

        // Bind event handlers so they are only bound once for every instance.
        this._onCloseClick = this._onCloseClick.bind(this);
        this._renderMessage = this._renderMessage.bind(this);
        this._renderPanelContent = this._renderPanelContent.bind(this);
        this._setChatInputRef = this._setChatInputRef.bind(this);
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

    _onCloseClick: () => void;

    /**
     * Callback invoked to hide {@code Chat}.
     *
     * @returns {void}
     */
    _onCloseClick() {
        this.props.dispatch(toggleChat());
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
                <ChatInput getChatInputRef = { this._setChatInputRef } />
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

        const { _isOpen, _showNamePrompt } = this.props;
        const ComponentToRender = !_isOpen && state === 'exited'
            ? null
            : (
                <div>
                    <div
                        className = 'chat-close'
                        onClick = { this._onCloseClick }>X</div>
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

    _setChatInputRef: (?HTMLElement) => void;

    /**
     * Sets a reference to the HTML text input element used for typing in chat
     * messages.
     *
     * @param {Object} chatInput - The input for typing chat messages.
     * @private
     * @returns {void}
     */
    _setChatInputRef(chatInput: ?HTMLElement) {
        this._chatInput = chatInput;
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

/**
 * Maps (parts of) the redux state to {@link Chat} React {@code Component}
 * props.
 *
 * @param {Object} state - The redux store/state.
 * @private
 * @returns {{
 *     _conference: Object,
 *     _isOpen: boolean,
 *     _messages: Array<Object>,
 *     _showNamePrompt: boolean
 * }}
 */
function _mapStateToProps(state) {
    const { isOpen, messages } = state['features/chat'];
    const localParticipant = getLocalParticipant(state);

    return {
        _conference: state['features/base/conference'].conference,
        _isOpen: isOpen,
        _messages: messages,
        _showNamePrompt: !localParticipant.name
    };
}

export default translate(connect(_mapStateToProps)(Chat));
