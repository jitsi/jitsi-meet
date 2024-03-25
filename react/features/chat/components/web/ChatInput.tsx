import React, { Component, RefObject } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { v4 as uuidV4 } from 'uuid';
import { IReduxState, IStore } from '../../../app/types';
import { isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n/functions';
import { IconFaceSmile, IconSend } from '../../../base/icons/svg';
import Button from '../../../base/ui/components/web/Button';
import Input from '../../../base/ui/components/web/Input';
import { CMEET_ENV } from "../../ENV";
import { LocalStorageHandle } from '../../LocalStorageHandler';
import { MESSAGE_TYPE_REMOTE } from '../../constants';
import { areSmileysDisabled } from '../../functions';
import SmileysPanel from './SmileysPanel';
/**
 * The type of the React {@code Component} props of {@link ChatInput}.
 */
interface IProps extends WithTranslation {

    /**
     * Whether chat emoticons are disabled.
     */
    _areSmileysDisabled: boolean;

    /**
     * The id of the message recipient, if any.
     */
    _privateMessageRecipientId?: string;

    /**
     * Invoked to send chat messages.
     */
    dispatch: IStore['dispatch'];

    /**
     * Callback to invoke on message send.
     */
    onSend: Function;
}

/**
 * The type of the React {@code Component} state of {@link ChatInput}.
 */
interface IState {

    /**
     * User provided nickname when the input text is provided in the view.
     */
    message: string;

    /**
     * Whether or not the smiley selector is visible.
     */
    showSmileysPanel: boolean;
}

/**
 * Implements a React Component for drafting and submitting a chat message.
 *
 * @augments Component
 */
class ChatInput extends Component<IProps, IState> {
    componentWillUnmount(): void {
        this.stompClient.deactivate();
    }
    _textArea?: RefObject<HTMLTextAreaElement>;

    state = {
        message: '',
        showSmileysPanel: false
    };

    stompClient: any;
    meetingId: any;
    user: any;

    /**
     * Initializes a new {@code ChatInput} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        this._textArea = React.createRef<HTMLTextAreaElement>();

        // Bind event handlers so they are only bound once for every instance.
        this._onDetectSubmit = this._onDetectSubmit.bind(this);
        this._onMessageChange = this._onMessageChange.bind(this);
        this._onSmileySelect = this._onSmileySelect.bind(this);
        this._onSubmitMessage = this._onSubmitMessage.bind(this);
        this._toggleSmileysPanel = this._toggleSmileysPanel.bind(this);
        this._oninit()
        this.stompClient = new Client();
        this.stompClient.webSocketFactory = () => {
            return new SockJS(CMEET_ENV.urlWS);
        };
        this._onConnectWS();
    }
    // Update WS
    _oninit() {
        this.user = new LocalStorageHandle("features/base/settings").getByKey()
        if(this.user.hasOwnProperty("id") || !this.user.id){
            this.user.id = uuidV4();
        }
        this.meetingId = window.location.href.split('/').at(-1)
    }

    async _onConnectWS() {
        this.stompClient.onConnect = (frame: any) => {
            console.log("Connected to WebSocket");
            this._onHandleMessage()
        };
        this.stompClient.activate();
    }

    _onSendChatCMeet(content: String) {
        if (this._isValidUUID(this.meetingId)) {
            this._publicStomp(CMEET_ENV.public, {
                content: content,
                sender: this.user.displayName,
                meetingId: this.meetingId,
                timeSheetId: null,
                userId: this.user.id,
                avatar: CMEET_ENV.avatar,
                fileExtension: null,
                filePath: null,
            })
        }
    }
    _isValidUUID(arg: any) {
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (arg instanceof Array) {
            return arg.every(x => uuidRegex.test(x))
        }
        return uuidRegex.test(arg)
    }
    _publicStomp(destination: String, body: any) {
        this.stompClient.publish({
            destination: destination,
            body: JSON.stringify(body),
        });
    }
    _onHandleMessage() {
        this.stompClient.subscribe(CMEET_ENV.subrice, ({ body }: any) => {
            const data = JSON.parse(body);
            const { userId, meetingId } = data;
            if (data.meetingId == meetingId && this.user.id != userId) {
                this.props.onSend({
                    displayName: data.sender,
                    hasRead: false,
                    id: data.id,
                    messageType: MESSAGE_TYPE_REMOTE,
                    message: data.content,
                    privateMessage: false,
                    lobbyChat: false,
                    recipient: '', //
                    timestamp: Date.now(),
                    isReaction: false
                });
            }
        });
    }

    /**
     * Implements React's {@link Component#componentDidMount()}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        if (isMobileBrowser()) {
            // Ensure textarea is not focused when opening chat on mobile browser.
            this._textArea?.current && this._textArea.current.blur();
        } else {
            this._focus();
        }
    }

    /**
     * Implements {@code Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps: Readonly<IProps>) {
        if (prevProps._privateMessageRecipientId !== this.props._privateMessageRecipientId) {
            this._textArea?.current?.focus();
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
            <div className = { `chat-input-container${this.state.message.trim().length ? ' populated' : ''}` }>
                <div id = 'chat-input' >
                    {!this.props._areSmileysDisabled && this.state.showSmileysPanel && (
                        <div
                            className = 'smiley-input'>
                            <div
                                className = 'smileys-panel' >
                                <SmileysPanel
                                    onSmileySelect = { this._onSmileySelect } />
                            </div>
                        </div>
                    )}
                    <Input
                        className = 'chat-input'
                        icon = { this.props._areSmileysDisabled ? undefined : IconFaceSmile }
                        iconClick = { this._toggleSmileysPanel }
                        id = 'chat-input-messagebox'
                        maxRows = { 5 }
                        onChange = { this._onMessageChange }
                        onKeyPress = { this._onDetectSubmit }
                        placeholder = { this.props.t('chat.messagebox') }
                        ref = { this._textArea }
                        textarea = { true }
                        value = { this.state.message } />
                    <Button
                        accessibilityLabel = { this.props.t('chat.sendButton') }
                        disabled = { !this.state.message.trim() }
                        icon = { IconSend }
                        onClick = { this._onSubmitMessage }
                        size = { isMobileBrowser() ? 'large' : 'medium' } />
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
        this._textArea?.current && this._textArea.current.focus();
    }

    /**
     * Submits the message to the chat window.
     *
     * @returns {void}
     */
    _onSubmitMessage() {
        const trimmed = this.state.message.trim();
        if (trimmed) {
            this.props.onSend(trimmed);
            this._onSendChatCMeet(trimmed)
            this.setState({ message: '' });
            // Keep the textarea in focus when sending messages via submit button.
            this._focus();
        }

    }

    /**
     * Detects if enter has been pressed. If so, submit the message in the chat
     * window.
     *
     * @param {string} event - Keyboard event.
     * @private
     * @returns {void}
     */
    _onDetectSubmit(event: any) {
        // Composition events used to add accents to characters
        // despite their absence from standard US keyboards,
        // to build up logograms of many Asian languages
        // from their base components or categories and so on.
        if (event.isComposing || event.keyCode === 229) {
            // keyCode 229 means that user pressed some button,
            // but input method is still processing that.
            // This is a standard behavior for some input methods
            // like entering japanese or сhinese hieroglyphs.
            return;
        }

        if (event.key === 'Enter'
            && event.shiftKey === false
            && event.ctrlKey === false) {
            event.preventDefault();
            event.stopPropagation();

            this._onSubmitMessage();
        }
    }

    /**
     * Updates the known message the user is drafting.
     *
     * @param {string} value - Keyboard event.
     * @private
     * @returns {void}
     */
    _onMessageChange(value: string) {
        this.setState({ message: value });
    }

    /**
     * Appends a selected smileys to the chat message draft.
     *
     * @param {string} smileyText - The value of the smiley to append to the
     * chat message.
     * @private
     * @returns {void}
     */
    _onSmileySelect(smileyText: string) {
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

    /**
     * Callback invoked to hide or show the smileys selector.
     *
     * @private
     * @returns {void}
     */
    _toggleSmileysPanel() {
        if (this.state.showSmileysPanel) {
            this._focus();
        }
        this.setState({ showSmileysPanel: !this.state.showSmileysPanel });
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @private
 * @returns {{
 *     _areSmileysDisabled: boolean
 * }}
 */
const mapStateToProps = (state: IReduxState) => {
    const { privateMessageRecipient } = state['features/chat'];

    return {
        _areSmileysDisabled: areSmileysDisabled(state),
        _privateMessageRecipientId: privateMessageRecipient?.id
    };
};

export default translate(connect(mapStateToProps)(ChatInput));
