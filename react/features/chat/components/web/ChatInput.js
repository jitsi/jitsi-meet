// @flow

import Spinner from '@atlaskit/spinner';
import React, { Component } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import type { Dispatch } from 'redux';

import { isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n';
import { Icon, IconPlane, IconSmile, IconDeviceDocument } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { showErrorNotification } from '../../../notifications';

import { MAX_FILE_SHARE_SIZE } from './../../constants';
import SmileysPanel from './SmileysPanel';

/**
 * The type of the React {@code Component} props of {@link ChatInput}.
 */
type Props = {

    /**
     * Invoked to send chat messages.
     */
    dispatch: Dispatch<any>,

    /**
     * The server which hosts the file transfered from chat.
     */
    fileTransferCdnServer: string,

    /**
     * Optional callback to invoke when the chat textarea has auto-resized to
     * fit overflowing text.
     */
    onResize: ?Function,

    /**
     * Callback to invoke on message send.
     */
    onSend: Function,

    /**
     * The backend safe roomname.
     */
    roomName: string,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
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
        showSmileysPanel: false,
        isUploading: false
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
        this._fileInputRef = React.createRef();

        // Bind event handlers so they are only bound once for every instance.
        this._onDetectSubmit = this._onDetectSubmit.bind(this);
        this._onMessageChange = this._onMessageChange.bind(this);
        this._onSmileySelect = this._onSmileySelect.bind(this);
        this._onSubmitMessage = this._onSubmitMessage.bind(this);
        this._onToggleSmileysPanel = this._onToggleSmileysPanel.bind(this);
        this._onEscHandler = this._onEscHandler.bind(this);
        this._onToggleSmileysPanelKeyPress = this._onToggleSmileysPanelKeyPress.bind(this);
        this._onSubmitMessageKeyPress = this._onSubmitMessageKeyPress.bind(this);
        this._setTextAreaRef = this._setTextAreaRef.bind(this);
        this._onFileInputChange = this._onFileInputChange.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        if (isMobileBrowser()) {
            // Ensure textarea is not focused when opening chat on mobile browser.
            this._textArea && this._textArea.blur();
        }
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
            <div className = { `chat-input-container${this.state.message.trim().length ? ' populated' : ''}` }>
                <div id = 'chat-input' >
                    <div className = 'smiley-input'>
                        <div id = 'smileysarea'>
                            <div id = 'smileys'>
                                <div
                                    aria-expanded = { this.state.showSmileysPanel }
                                    aria-haspopup = 'smileysContainer'
                                    aria-label = { this.props.t('chat.smileysPanel') }
                                    className = 'smiley-button'
                                    onClick = { this._onToggleSmileysPanel }
                                    onKeyDown = { this._onEscHandler }
                                    onKeyPress = { this._onToggleSmileysPanelKeyPress }
                                    role = 'button'
                                    tabIndex = { 0 }>
                                    <Icon src = { IconSmile } />
                                </div>
                            </div>
                        </div>
                        <div className = { smileysPanelClassName }>
                            <SmileysPanel
                                onSmileySelect = { this._onSmileySelect } />
                        </div>
                    </div>
                    <div className = 'usrmsg-form'>
                        <TextareaAutosize
                            autoComplete = 'off'
                            autoFocus = { true }
                            id = 'usermsg'
                            maxRows = { 5 }
                            onChange = { this._onMessageChange }
                            onHeightChange = { this.props.onResize }
                            onKeyDown = { this._onDetectSubmit }
                            placeholder = { this.props.t('chat.messagebox') }
                            ref = { this._setTextAreaRef }
                            tabIndex = { 0 }
                            value = { this.state.message } />
                    </div>
                    <div className = 'send-button-container'>
                        <div
                            aria-label = { this.props.t('chat.sendButton') }
                            className = 'send-button'
                            onClick = { this._onSubmitMessage }
                            onKeyPress = { this._onSubmitMessageKeyPress }
                            role = 'button'
                            tabIndex = { this.state.message.trim() ? 0 : -1 } >
                            <Icon src = { IconPlane } />
                        </div>
                        { this.state.isUploading ? <Spinner /> : (
                            <div>
                                <label htmlFor = 'file-input'>
                                    <IconDeviceDocument className = 'file-share-icon white' />
                                </label>
                                <input
                                    className = 'file-share-hidden-file-input'
                                    id = 'file-input'
                                    onChange = { this._onFileInputChange }
                                    ref = { this._fileInputRef }
                                    type = 'file' />
                            </div>
                        ) }
                    </div>
                </div>
            </div>
        );
    }

    /**
     * Place cursor focus on this component's text area.
     *
     * @private
     * @returns {void}
     */
    _focus() {
        this._textArea && this._textArea.focus();
    }

    _onFileInputChange: () => void;

    /**
     * Triggers upload of selected file.
     *
     * @returns {void}
     *
     */
    _onFileInputChange() {
        const file = this._fileInputRef?.current?.files[0];

        if (!file) {
            return;
        }

        const { fileTransferCdnServer, dispatch } = this.props;
        const maxAllowedSize = MAX_FILE_SHARE_SIZE * 1024 * 1024;

        if (file.size > maxAllowedSize) {
            dispatch(showErrorNotification({
                titleArguments: {
                    size: MAX_FILE_SHARE_SIZE
                },
                titleKey: 'chat.fileTransfer.fileTooBig'
            }));

            return;
        }

        const formData = new FormData();

        formData.append('file', file, file.name);
        formData.append('fqn', this.props.roomName);

        this.setState({ isUploading: true });

        fetch(`${fileTransferCdnServer}/api/fileUpload`, {
            body: formData,
            method: 'POST'
        })
        .then(resp => {
            if (resp.ok) {
                return resp.json();
            }
            throw new Error('Invalid response');

        })
        .then(data => {
            const mimeType = encodeURIComponent(data.mimetype);
            const fileName = encodeURIComponent(data.fileName);

            this.props.onSend(`${fileTransferCdnServer}/${data.url}?mimeType=${mimeType}&fileName=${fileName}`);
        })
        .catch(err => {
            console.error(err);
        })
        .finally(() => this.setState({ isUploading: false }));
    }

    _onSubmitMessage: () => void;

    /**
     * Submits the message to the chat window.
     *
     * @returns {void}
     */
    _onSubmitMessage() {
        const trimmed = this.state.message.trim();

        if (trimmed) {
            this.props.onSend(trimmed);

            this.setState({ message: '' });

            // Keep the textarea in focus when sending messages via submit button.
            this._focus();
        }

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
        if (event.key === 'Enter'
            && event.shiftKey === false
            && event.ctrlKey === false) {
            event.preventDefault();
            event.stopPropagation();

            this._onSubmitMessage();
        }
    }

    _onSubmitMessageKeyPress: (Object) => void;

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onSubmitMessageKeyPress(e) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            this._onSubmitMessage();
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
        if (smileyText) {
            this.setState({
                message: `${this.state.message} ${smileyText}`,
                showSmileysPanel: false
            });
        } else {
            this.setState({
                showSmileysPanel: false
            });
        }

        this._focus();
    }

    _onToggleSmileysPanel: () => void;

    /**
     * Callback invoked to hide or show the smileys selector.
     *
     * @private
     * @returns {void}
     */
    _onToggleSmileysPanel() {
        if (this.state.showSmileysPanel) {
            this._focus();
        }
        this.setState({ showSmileysPanel: !this.state.showSmileysPanel });
    }

    _onEscHandler: (Object) => void;

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onEscHandler(e) {
        // Escape handling does not work in onKeyPress
        if (this.state.showSmileysPanel && e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            this._onToggleSmileysPanel();
        }
    }

    _onToggleSmileysPanelKeyPress: (Object) => void;

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onToggleSmileysPanelKeyPress(e) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            this._onToggleSmileysPanel();
        }
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
    }
}

export default translate(connect()(ChatInput));
