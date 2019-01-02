// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import Emoji from 'react-emoji-render';

import { sendMessage } from '../actions';

import SmileysPanel from './SmileysPanel';

/**
 * The type of the React {@code Component} props of {@link ChatInput}.
 */
type Props = {

    /**
     * Invoked to send chat messages.
     */
    dispatch: Dispatch<*>,

    /**
     * Optional callback to get a reference to the chat input element.
     */
    getChatInputRef?: Function
};

/**
 * The type of the React {@code Component} state of {@link ChatInput}.
 */
type State = {

    /**
     * User provided nickname when the input text is provided in the view.
     */
    message: string,

    /**
     * Whether or not the smiley selector is visible.
     */
    showSmileysPanel: boolean
};

/**
 * Implements a React Component for drafting and submitting a chat message.
 *
 * @extends Component
 */
class ChatInput extends Component<Props, State> {
    _textArea: ?HTMLTextAreaElement;

    state = {
        message: '',
        showSmileysPanel: false
    };

    /**
     * Initializes a new {@code ChatInput} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this._textArea = null;

        // Bind event handlers so they are only bound once for every instance.
        this._onDetectSubmit = this._onDetectSubmit.bind(this);
        this._onMessageChange = this._onMessageChange.bind(this);
        this._onSmileySelect = this._onSmileySelect.bind(this);
        this._onToggleSmileysPanel = this._onToggleSmileysPanel.bind(this);
        this._setTextAreaRef = this._setTextAreaRef.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        /**
         * HTML Textareas do not support autofocus. Simulate autofocus by
         * manually focusing.
         */
        this.focus();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const smileysPanelClassName = `${this.state.showSmileysPanel
            ? 'show-smileys' : 'hide-smileys'} smileys-panel`;

        return (
            <div id = 'chat-input' >
                <div className = 'smiley-input'>
                    <div id = 'smileysarea'>
                        <div id = 'smileys'>
                            <Emoji
                                onClick = { this._onToggleSmileysPanel }
                                text = ':)' />
                        </div>
                    </div>
                    <div className = { smileysPanelClassName }>
                        <SmileysPanel
                            onSmileySelect = { this._onSmileySelect } />
                    </div>
                </div>
                <div className = 'usrmsg-form'>
                    <textarea
                        data-i18n = '[placeholder]chat.messagebox'
                        id = 'usermsg'
                        onChange = { this._onMessageChange }
                        onKeyDown = { this._onDetectSubmit }
                        placeholder = { 'Enter Text...' }
                        ref = { this._setTextAreaRef }
                        value = { this.state.message } />
                </div>
            </div>
        );
    }

    /**
     * Removes cursor focus on this component's text area.
     *
     * @returns {void}
     */
    blur() {
        this._textArea && this._textArea.blur();
    }

    /**
     * Place cursor focus on this component's text area.
     *
     * @returns {void}
     */
    focus() {
        this._textArea && this._textArea.focus();
    }

    _onDetectSubmit: (Object) => void;

    /**
     * Detects if enter has been pressed. If so, submit the message in the chat
     * window.
     *
     * @param {string} event - Keyboard event.
     * @private
     * @returns {void}
     */
    _onDetectSubmit(event) {
        if (event.keyCode === 13
            && event.shiftKey === false) {
            event.preventDefault();

            this.props.dispatch(sendMessage(this.state.message));

            this.setState({ message: '' });
        }
    }

    _onMessageChange: (Object) => void;

    /**
     * Updates the known message the user is drafting.
     *
     * @param {string} event - Keyboard event.
     * @private
     * @returns {void}
     */
    _onMessageChange(event) {
        this.setState({ message: event.target.value });
    }

    _onSmileySelect: (string) => void;

    /**
     * Appends a selected smileys to the chat message draft.
     *
     * @param {string} smileyText - The value of the smiley to append to the
     * chat message.
     * @private
     * @returns {void}
     */
    _onSmileySelect(smileyText) {
        this.setState({
            message: `${this.state.message} ${smileyText}`,
            showSmileysPanel: false
        });

        this.focus();
    }

    _onToggleSmileysPanel: () => void;

    /**
     * Callback invoked to hide or show the smileys selector.
     *
     * @private
     * @returns {void}
     */
    _onToggleSmileysPanel() {
        this.setState({ showSmileysPanel: !this.state.showSmileysPanel });

        this.focus();
    }

    _setTextAreaRef: (?HTMLTextAreaElement) => void;

    /**
     * Sets the reference to the HTML TextArea.
     *
     * @param {HTMLAudioElement} textAreaElement - The HTML text area element.
     * @private
     * @returns {void}
     */
    _setTextAreaRef(textAreaElement: ?HTMLTextAreaElement) {
        this._textArea = textAreaElement;

        if (this.props.getChatInputRef) {
            this.props.getChatInputRef(textAreaElement);
        }
    }
}

export default connect()(ChatInput);
