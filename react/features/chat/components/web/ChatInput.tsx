import { Theme } from '@mui/material';
import React, { Component, RefObject } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { withStyles } from 'tss-react/mui';

import { IReduxState, IStore } from '../../../app/types';
import { isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n/functions';
import Icon from '../../../base/icons/components/Icon';
import { IconFaceSmile, IconSend } from '../../../base/icons/svg';
import Button from '../../../base/ui/components/web/Button';
import Input from '../../../base/ui/components/web/Input';
import { CHAT_SIZE, OPTION_GROUPCHAT } from '../../constants';
import { areSmileysDisabled, isSendGroupChatDisabled } from '../../functions';

import SmileysPanel from './SmileysPanel';


const styles = (_theme: Theme, { _chatWidth }: IProps) => {
    return {
        // Only keep minimal JSS styles for dynamic values, use SCSS for static styles
        floatingPanel: {
            width: `${_chatWidth - 32}px`
        },

        smileysPopup: {
            width: '240px',
            maxHeight: '330px'
        },

        inputOverride: {
            width: '100%',
            '& textarea': {
                fontSize: isMobileBrowser() ? '1rem' : '0.75rem',
                lineHeight: '1.25rem',
                paddingTop: '40px',
                paddingRight: '70px', // Extra space for emoji + send button
                paddingBottom: '40px',
                minHeight: '40px'
            }
        },

        chatDisabled: {
            borderTop: `1px solid ${_theme.palette.chatInputBorder}`,
            padding: _theme.spacing(4),
            textAlign: 'center' as const,
        },

        // Mobile adjustments that need theme values
        mobileRecipientTrigger: {
            fontSize: '14px',
            padding: '6px 10px'
        },

        mobileEmojiTrigger: {
            right: '70px' // Adjusted for send button
        },

        mobileSendTrigger: {
            bottom: '10px',
            right: '14px'
        }
    };
};

interface IProps extends WithTranslation {
    _areSmileysDisabled: boolean;
    _chatWidth: number;
    _isSendGroupChatDisabled: boolean;
    _privateMessageRecipientId?: string;
    _privateMessageRecipientName?: string;
    classes?: Partial<Record<keyof ReturnType<typeof styles>, string>>;
    dispatch: IStore['dispatch'];
    onRecipientChange?: (e: any) => void;
    onSend: Function;
    recipientOptions?: Array<{ label: string; value: string; }>;
    selectedRecipient?: string;
}

interface IState {
    message: string;
    showRecipientMenu: boolean;
    showSmileysPanel: boolean;
}

/**
 * Implements a React Component for drafting and submitting a chat message.
 *
 * @augments Component
 */
class ChatInput extends Component<IProps, IState> {
    _textArea?: RefObject<HTMLTextAreaElement>;
    _containerRef: RefObject<HTMLDivElement>;

    override state = {
        message: '',
        showSmileysPanel: false,
        showRecipientMenu: false
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
        this._containerRef = React.createRef<HTMLDivElement>();

        // Bind event handlers so they are only bound once for every instance.
        this._onDetectSubmit = this._onDetectSubmit.bind(this);
        this._onMessageChange = this._onMessageChange.bind(this);
        this._onSmileySelect = this._onSmileySelect.bind(this);
        this._onSubmitMessage = this._onSubmitMessage.bind(this);
        this._onToggleSmileysPanel = this._onToggleSmileysPanel.bind(this);
        this._onToggleRecipientMenu = this._onToggleRecipientMenu.bind(this);
        this._handleClickOutside = this._handleClickOutside.bind(this);
        this._onRecipientSelect = this._onRecipientSelect.bind(this);
        this._createMenuItemClickHandler = this._createMenuItemClickHandler.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}.
     *
     * @inheritdoc
     */
    override componentDidMount() {
        if (!isMobileBrowser()) {
            this._focus();
        }
        document.addEventListener('mousedown', this._handleClickOutside);
    }

    /**
     * Implements React's {@link Component#componentWillUnmount()}.
     *
     * @inheritdoc
     */
    override componentWillUnmount() {
        document.removeEventListener('mousedown', this._handleClickOutside);
    }

    /**
     * Handles clicks outside the component to close floating panels.
     *
     * @param {MouseEvent} event - The mouse event.
     * @private
     * @returns {void}
     */
    _handleClickOutside(event: MouseEvent) {
        if (this._containerRef.current && !this._containerRef.current.contains(event.target as Node)) {
            this.setState({
                showSmileysPanel: false,
                showRecipientMenu: false
            });
        }
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
     * Callback invoked to hide or show the recipient menu.
     *
     * @private
     * @returns {void}
     */
    _onToggleRecipientMenu() {
        this.setState({
            showRecipientMenu: !this.state.showRecipientMenu,
            showSmileysPanel: false
        });
    }

    /**
     * Callback invoked to hide or show the smileys selector.
     *
     * @private
     * @returns {void}
     */
    _onToggleSmileysPanel() {
        this.setState({
            showSmileysPanel: !this.state.showSmileysPanel,
            showRecipientMenu: false
        });
    }

    /**
     * Handles recipient selection from the menu.
     *
     * @param {string} value - The selected recipient value.
     * @private
     * @returns {void}
     */
    _onRecipientSelect(value: string) {
        if (this.props.onRecipientChange) {
            this.props.onRecipientChange({ target: { value } });
        }
        this.setState({ showRecipientMenu: false });
        this._focus();
    }

    /**
     * Creates a click handler for a menu item.
     *
     * @param {string} value - The recipient value.
     * @returns {Function} - The click handler function.
     * @private
     */
    _createMenuItemClickHandler(value: string) {
        return (event: React.MouseEvent) => {
            event.preventDefault();
            this._onRecipientSelect(value);
        };
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
        this.setState({
            message: smileyText ? `${this.state.message} ${smileyText}` : this.state.message,
            showSmileysPanel: false
        }, () => this._focus());
    }

    /**
     * Submits the message to the chat window.
     *
     * @returns {void}
     */
    _onSubmitMessage() {
        const { _isSendGroupChatDisabled, _privateMessageRecipientId, onSend } = this.props;

        if (_isSendGroupChatDisabled && !_privateMessageRecipientId) return;

        const trimmed = this.state.message.trim();

        if (trimmed) {
            onSend(trimmed);
            this.setState({ message: '', showSmileysPanel: false });
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
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        const { classes, t, _privateMessageRecipientName, recipientOptions, _areSmileysDisabled, selectedRecipient } = this.props;
        const hideInput = this.props._isSendGroupChatDisabled && !this.props._privateMessageRecipientId;
        const isMobile = isMobileBrowser();

        if (hideInput) {
            return <div className = { classes?.chatDisabled }>{t('chat.disabled')}</div>;
        }

        return (
            <div
                className = 'chat-input-container'
                ref = { this._containerRef }>
                <div id = 'chat-input'>

                    {/* Floating Panels */}
                    {!_areSmileysDisabled && this.state.showSmileysPanel && (
                        <div className = { `chat-floating-panel chat-floating-panel-right chat-smileys-popup ${classes?.floatingPanel} ${classes?.smileysPopup}` }>
                            <SmileysPanel onSmileySelect = { this._onSmileySelect } />
                        </div>
                    )}

                    {this.state.showRecipientMenu && recipientOptions && (
                        <div className = 'chat-floating-panel chat-floating-panel-left chat-recipient-menu'>
                            {recipientOptions.map(option => {
                                const isSelected = option.value === (selectedRecipient || OPTION_GROUPCHAT);
                                const className = `chat-menu-item ${isSelected ? 'selected' : ''}`;
                                const onClick = this._createMenuItemClickHandler(option.value);

                                return (
                                    <div
                                        className = { className }
                                        key = { option.value }
                                        onClick = { onClick }>
                                        {option.label}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className = 'chat-input-wrapper'>
                        <div className = 'chat-input-field-container'>

                            {/* Left Adornment: Recipient */}
                            <div
                                className = { `chat-recipient-trigger ${isMobile ? classes?.mobileRecipientTrigger : ''}` }
                                onClick = { this._onToggleRecipientMenu }>
                                {t('to')}: {_privateMessageRecipientName || t('chat.everyone')}
                            </div>

                            {/* Main Input Component */}
                            <Input
                                className = { `chat-input-override ${classes?.inputOverride}` }
                                id = 'chat-input-messagebox'
                                maxRows = { 5 }
                                onChange = { this._onMessageChange }
                                onKeyPress = { this._onDetectSubmit }
                                placeholder = { this.state.message ? '' : t('chat.messagebox') }
                                ref = { this._textArea }
                                textarea = { true }
                                value = { this.state.message } />

                            {/* Right Adornment: Emoji */}
                            {!_areSmileysDisabled && (
                                <div
                                    className = { `chat-emoji-trigger ${isMobile ? classes?.mobileEmojiTrigger : ''}` }
                                    onClick = { this._onToggleSmileysPanel }>
                                    <Icon
                                        size = { 20 }
                                        src = { IconFaceSmile } />
                                </div>
                            )}

                            {/* Send Button - Positioned absolutely inside input */}
                            <div className = 'chat-send-button-container'>
                                <Button
                                    accessibilityLabel = { t('chat.sendButton') }
                                    disabled = { !this.state.message.trim() }
                                    icon = { IconSend }
                                    onClick = { this._onSubmitMessage }
                                    size = { isMobile ? 'large' : 'medium' } />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @private
 * @returns {{
 *     _areSmileysDisabled: boolean,
 *     _privateMessageRecipientId: string,
 *     _privateMessageRecipientName: string,
 *     _isSendGroupChatDisabled: boolean,
 *     _chatWidth: number
 * }}
 */
const mapStateToProps = (state: IReduxState) => {
    const { privateMessageRecipient, width } = state['features/chat'];
    const isGroupChatDisabled = isSendGroupChatDisabled(state);

    return {
        _areSmileysDisabled: areSmileysDisabled(state),
        _privateMessageRecipientId: privateMessageRecipient?.id,
        _privateMessageRecipientName: privateMessageRecipient?.name,
        _isSendGroupChatDisabled: isGroupChatDisabled,
        _chatWidth: width.current ?? CHAT_SIZE,
    };
};

export default translate(connect(mapStateToProps)(withStyles(ChatInput, styles)));
