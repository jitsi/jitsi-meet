import { Theme } from '@mui/material';
import React, { Component, RefObject } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { withStyles } from 'tss-react/mui';

import { IReduxState, IStore } from '../../../app/types';
import { isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n/functions';
import { IconFaceSmile, IconSend } from '../../../base/icons/svg';
import Button from '../../../base/ui/components/web/Button';
import Input from '../../../base/ui/components/web/Input';
import { CHAT_SIZE } from '../../constants';
import { areSmileysDisabled, isSendGroupChatDisabled } from '../../functions';

import SmileysPanel from './SmileysPanel';

const SUPPORTED_LANGUAGES = [
    'javascript',
    'typescript',
    'python',
    'java',
    'cpp',
    'csharp',
    'html',
    'css',
    'json',
    'bash',
    'shell',
    'sql',
    'go',
    'rust',
    'php',
    'ruby',
    'kotlin',
    'swift',
    'yaml',
    'xml',
];

const styles = (_theme: Theme, { _chatWidth }: IProps) => {
    return {
        smileysPanel: {
            bottom: '100%',
            boxSizing: 'border-box' as const,
            backgroundColor: 'rgba(0, 0, 0, .6) !important',
            height: 'auto',
            display: 'flex' as const,
            overflow: 'hidden',
            position: 'absolute' as const,
            width: `${_chatWidth - 32}px`,
            marginBottom: '5px',
            marginLeft: '-5px',
            transition: 'max-height 0.3s',

            '& #smileysContainer': {
                backgroundColor: '#131519',
                borderTop: '1px solid #A4B8D1'
            }
        },
        chatDisabled: {
            borderTop: `1px solid ${_theme.palette.ui02}`,
            boxSizing: 'border-box' as const,
            padding: _theme.spacing(4),
            textAlign: 'center' as const,
        },
        chatInputInner: {
            position: 'relative' as const,
        },
        formattingToolbar: {
            display: 'flex' as const,
            flexDirection: 'row' as const,
            gap: '4px',
            paddingBottom: '4px',
            paddingLeft: '2px',
        },
        formattingButton: {
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '4px',
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: '12px',
            fontWeight: 'bold' as const,
            height: '24px',
            minWidth: '28px',
            padding: '0 6px',
            transition: 'background 0.15s, color 0.15s',

            '&:hover': {
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
            }
        },
        formattingButtonItalic: {
            fontStyle: 'italic',
        },
        codeZone: {
            background: '#1e1e1e',
            border: '1px solid #444',
            borderRadius: '6px',
            bottom: '100%',
            boxSizing: 'border-box' as const,
            left: '0',
            marginBottom: '4px',
            padding: '12px',
            position: 'absolute' as const,
            right: '0',
            zIndex: 300,
        },
        codeZoneHeader: {
            alignItems: 'center' as const,
            display: 'flex' as const,
            flexDirection: 'row' as const,
            gap: '8px',
            justifyContent: 'space-between' as const,
            marginBottom: '8px',
        },
        codeZoneTitle: {
            color: '#ccc',
            fontSize: '13px',
            fontWeight: 'bold' as const,
        },
        codeZoneControls: {
            alignItems: 'center' as const,
            display: 'flex' as const,
            flexDirection: 'row' as const,
            gap: '8px',
        },
        langSelect: {
            background: '#2d2d2d',
            border: '1px solid #555',
            borderRadius: '4px',
            color: '#ccc',
            fontSize: '12px',
            padding: '3px 6px',
        },
        closeButton: {
            background: 'transparent',
            border: 'none',
            color: '#aaa',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: 1,
            padding: '0 4px',

            '&:hover': {
                color: '#fff',
            }
        },
        codeZoneTextarea: {
            background: '#2d2d2d',
            border: 'none',
            borderRadius: '4px',
            boxSizing: 'border-box' as const,
            color: '#ccc',
            fontFamily: 'monospace',
            fontSize: '13px',
            minHeight: '96px',
            outline: 'none',
            padding: '8px',
            resize: 'vertical' as const,
            width: '100%',
        },
        codeZoneFooter: {
            display: 'flex' as const,
            justifyContent: 'flex-end' as const,
            marginTop: '8px',
        },
    };
};

/**
 * The type of the React {@code Component} props of {@link ChatInput}.
 */
interface IProps extends WithTranslation {

    /**
     * Whether chat emoticons are disabled.
     */
    _areSmileysDisabled: boolean;


    _chatWidth: number;

    /**
     * Whether sending group chat messages is disabled.
     */
    _isSendGroupChatDisabled: boolean;

    /**
     * The id of the message recipient, if any.
     */
    _privateMessageRecipientId?: string;

    /**
     * An object containing the CSS classes.
     */
    classes?: Partial<Record<keyof ReturnType<typeof styles>, string>>;

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
     * Content of the code zone textarea.
     */
    codeContent: string;

    /**
     * Currently selected language in the code zone.
     */
    codeLanguage: string;

    /**
     * User provided nickname when the input text is provided in the view.
     */
    message: string;

    /**
     * Whether the code zone popup is visible.
     */
    showCodeZone: boolean;

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
    _textArea?: RefObject<HTMLTextAreaElement>;

    override state = {
        codeContent: '',
        codeLanguage: '',
        message: '',
        showCodeZone: false,
        showSmileysPanel: false
    };

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
        this._insertCodeBlock = this._insertCodeBlock.bind(this);
        this._insertFormatting = this._insertFormatting.bind(this);
        this._onBoldClick = this._onBoldClick.bind(this);
        this._onInsertCodeBlock = this._onInsertCodeBlock.bind(this);
        this._onCloseCodeZone = this._onCloseCodeZone.bind(this);
        this._onCodeBlockClick = this._onCodeBlockClick.bind(this);
        this._onCodeContentChange = this._onCodeContentChange.bind(this);
        this._onCodeLanguageChange = this._onCodeLanguageChange.bind(this);
        this._onDetectSubmit = this._onDetectSubmit.bind(this);
        this._onInlineCodeClick = this._onInlineCodeClick.bind(this);
        this._onItalicClick = this._onItalicClick.bind(this);
        this._onMessageChange = this._onMessageChange.bind(this);
        this._onSmileySelect = this._onSmileySelect.bind(this);
        this._onSubmitMessage = this._onSubmitMessage.bind(this);
        this._toggleSmileysPanel = this._toggleSmileysPanel.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}.
     *
     * @inheritdoc
     */
    override componentDidMount() {
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
    override componentDidUpdate(prevProps: Readonly<IProps>) {
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
    override render() {
        const classes = withStyles.getClasses(this.props);
        const hideInput = this.props._isSendGroupChatDisabled && !this.props._privateMessageRecipientId;

        if (hideInput) {
            return (
                <div className = { classes.chatDisabled }>
                    {this.props.t('chat.disabled')}
                </div>
            );
        }

        const { codeContent, codeLanguage, showCodeZone } = this.state;

        return (
            <div className = { `chat-input-container${this.state.message.trim().length ? ' populated' : ''}` }>
                <div
                    className = { classes.chatInputInner }
                    id = 'chat-input'>
                    {!this.props._areSmileysDisabled && this.state.showSmileysPanel && (
                        <div className = 'smiley-input'>
                            <div className = { classes.smileysPanel }>
                                <SmileysPanel
                                    onSmileySelect = { this._onSmileySelect } />
                            </div>
                        </div>
                    )}

                    { showCodeZone && (
                        <div className = { classes.codeZone }>
                            <div className = { classes.codeZoneHeader }>
                                <span className = { classes.codeZoneTitle }>Code Block</span>
                                <div className = { classes.codeZoneControls }>
                                    <select
                                        className = { classes.langSelect }
                                        onChange = { this._onCodeLanguageChange }
                                        value = { codeLanguage }>
                                        <option value = ''>Auto</option>
                                        { SUPPORTED_LANGUAGES.map(lang => (
                                            <option
                                                key = { lang }
                                                value = { lang }>
                                                { lang }
                                            </option>
                                        )) }
                                    </select>
                                    <button
                                        className = { classes.closeButton }
                                        onClick = { this._onCloseCodeZone }
                                        title = 'Close'>
                                        &#x2715;
                                    </button>
                                </div>
                            </div>
                            <textarea
                                className = { classes.codeZoneTextarea }
                                onChange = { this._onCodeContentChange }
                                placeholder = 'Paste or type your code here...'
                                rows = { 4 }
                                value = { codeContent } />
                            <div className = { classes.codeZoneFooter }>
                                <Button
                                    accessibilityLabel = 'Insert into chat'
                                    label = 'Insert into chat'
                                    onClick = { this._onInsertCodeBlock }
                                    size = 'medium' />
                            </div>
                        </div>
                    ) }

                    <div className = { classes.formattingToolbar }>
                        <button
                            className = { classes.formattingButton }
                            onClick = { this._onBoldClick }
                            title = 'Bold'>
                            B
                        </button>
                        <button
                            className = { `${classes.formattingButton} ${classes.formattingButtonItalic}` }
                            onClick = { this._onItalicClick }
                            title = 'Italic'>
                            I
                        </button>
                        <button
                            className = { classes.formattingButton }
                            onClick = { this._onInlineCodeClick }
                            title = 'Inline code'>
                            {'</>'}
                        </button>
                        <button
                            className = { classes.formattingButton }
                            onClick = { this._onCodeBlockClick }
                            title = 'Code block'>
                            {'```'}
                        </button>
                    </div>

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
     * OnClick handler that inserts a fenced code block into the message from the code zone.
     *
     * @private
     * @returns {void}
     */
    _onInsertCodeBlock() {
        this._insertCodeBlock();
    }

    /**
     * Inserts a fenced code block into the message from the code zone.
     *
     * @private
     * @returns {void}
     */
    _insertCodeBlock() {
        const { codeContent, codeLanguage, message } = this.state;
        const fence = codeLanguage ? `\`\`\`${codeLanguage}\n` : '```\n';
        const block = `${fence}${codeContent}\n\`\`\``;

        this.setState({
            codeContent: '',
            codeLanguage: '',
            message: message ? `${message}\n${block}` : block,
            showCodeZone: false
        });
    }

    /**
     * Wraps currently selected text in the textarea with prefix/suffix markers,
     * or inserts them at the cursor position.
     *
     * @param {string} prefix - Opening marker.
     * @param {string} suffix - Closing marker.
     * @private
     * @returns {void}
     */
    _insertFormatting(prefix: string, suffix: string) {
        const textarea = this._textArea?.current;

        if (!textarea) {
            return;
        }

        const { selectionStart, selectionEnd, value } = textarea;
        const selected = value.slice(selectionStart, selectionEnd);
        const replacement = selected
            ? `${prefix}${selected}${suffix}`
            : `${prefix}${suffix}`;

        const newValue
            = value.slice(0, selectionStart) + replacement + value.slice(selectionEnd);
        const newCursor = selected
            ? selectionStart + replacement.length
            : selectionStart + prefix.length;

        this.setState({ message: newValue }, () => {
            textarea.focus();
            textarea.setSelectionRange(newCursor, newCursor);
        });
    }

    /**
     * Handles click on the Bold formatting button.
     *
     * @private
     * @returns {void}
     */
    _onBoldClick() {
        this._insertFormatting('**', '**');
    }

    /**
     * Closes the code zone popup and resets its state.
     *
     * @private
     * @returns {void}
     */
    _onCloseCodeZone() {
        this.setState({
            codeContent: '',
            codeLanguage: '',
            showCodeZone: false
        });
    }

    /**
     * Handles click on the Code Block formatting button.
     *
     * @private
     * @returns {void}
     */
    _onCodeBlockClick() {
        this.setState({ showCodeZone: true });
    }

    /**
     * Handles changes to the code zone textarea.
     *
     * @param {React.ChangeEvent<HTMLTextAreaElement>} event - The change event.
     * @private
     * @returns {void}
     */
    _onCodeContentChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
        this.setState({ codeContent: event.target.value });
    }

    /**
     * Handles changes to the language selector in the code zone.
     *
     * @param {React.ChangeEvent<HTMLSelectElement>} event - The change event.
     * @private
     * @returns {void}
     */
    _onCodeLanguageChange(event: React.ChangeEvent<HTMLSelectElement>) {
        this.setState({ codeLanguage: event.target.value });
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
     * Handles click on the Inline Code formatting button.
     *
     * @private
     * @returns {void}
     */
    _onInlineCodeClick() {
        this._insertFormatting('`', '`');
    }

    /**
     * Handles click on the Italic formatting button.
     *
     * @private
     * @returns {void}
     */
    _onItalicClick() {
        this._insertFormatting('*', '*');
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
     * Submits the message to the chat window.
     *
     * @returns {void}
     */
    _onSubmitMessage() {
        const {
            _isSendGroupChatDisabled,
            _privateMessageRecipientId,
            onSend
        } = this.props;

        if (_isSendGroupChatDisabled && !_privateMessageRecipientId) {
            return;
        }

        const trimmed = this.state.message.trim();

        if (trimmed) {
            onSend(trimmed);

            this.setState({ message: '' });

            // Keep the textarea in focus when sending messages via submit button.
            this._focus();

            // Hide the Emojis box after submitting the message
            this.setState({ showSmileysPanel: false });
        }

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
    const { privateMessageRecipient, width } = state['features/chat'];
    const isGroupChatDisabled = isSendGroupChatDisabled(state);

    return {
        _areSmileysDisabled: areSmileysDisabled(state),
        _privateMessageRecipientId: privateMessageRecipient?.id,
        _isSendGroupChatDisabled: isGroupChatDisabled,
        _chatWidth: width.current ?? CHAT_SIZE,
    };
};

export default translate(connect(mapStateToProps)(withStyles(ChatInput, styles)));
