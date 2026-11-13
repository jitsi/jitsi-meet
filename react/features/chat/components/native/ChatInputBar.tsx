import React, { Component, createRef } from 'react';
import { WithTranslation } from 'react-i18next';
import { EmitterSubscription, Keyboard, Platform, TextInput, TextStyle, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions.native';
import Icon from '../../../base/icons/components/Icon';
import { IconCheck, IconCloseLarge, IconEdit, IconSend } from '../../../base/icons/svg';
import IconButton from '../../../base/ui/components/native/IconButton';
import Input from '../../../base/ui/components/native/Input';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import { isSendGroupChatDisabled, isSendPrivateChatDisabled } from '../../functions';
import { IMessage } from '../../types';

import styles from './styles';

interface IProps extends WithTranslation {

    /**
     * Whether sending group chat messages is disabled.
     */
    _isSendGroupChatDisabled: boolean;

    /**
     * Whether the local participant is not allowed to send private messages.
     */
    _isSendPrivateChatDisabled: boolean;

    /**
     * The id of the message recipient, if any.
     */
    _privateMessageRecipientId?: string;

    /**
     * Application's aspect ratio.
     */
    aspectRatio: Symbol;

    /**
     * The local message being edited, if any. Its text fills the input.
     */
    editingMessage?: IMessage;

    /**
     * Callback to leave edit mode.
     */
    onCancelEdit?: () => void;

    /**
     * Callback to invoke on message send.
     */
    onSend: Function;
}

interface IState {

    /**
     * Boolean to show if an extra padding needs to be added to the bar.
     */
    addPadding: boolean;

    /**
     * The value of the input field.
     */
    message: string;

    /**
     * Boolean to show or hide the send button.
     */
    showSend: boolean;
}

/**
 * Returns whether the local participant cannot send what this input would send:
 * a private message when a recipient is selected, a group message if not.
 *
 * @param {IProps} props - The props of the component.
 * @returns {boolean}
 */
function _isSendDisabled({
    _isSendGroupChatDisabled,
    _isSendPrivateChatDisabled,
    _privateMessageRecipientId
}: IProps): boolean {
    return _privateMessageRecipientId ? _isSendPrivateChatDisabled : _isSendGroupChatDisabled;
}

/**
 * Implements the chat input bar with text field and action(s).
 */
class ChatInputBar extends Component<IProps, IState> {
    _draft = '';
    _inputRef = createRef<TextInput>();
    _keyboardSubscriptions: EmitterSubscription[] = [];

    /**
     * Instantiates a new instance of the component.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this.state = {
            addPadding: false,
            message: '',
            showSend: false
        };

        this._onCancelEdit = this._onCancelEdit.bind(this);
        this._onChangeText = this._onChangeText.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
    }

    /**
     * Fills the input with the text of the message to edit, and clears it when edit mode ends.
     *
     * @inheritdoc
     */
    override componentDidUpdate(prevProps: IProps) {
        const prevId = prevProps.editingMessage?.messageId;
        const id = this.props.editingMessage?.messageId;

        if (prevId === id) {
            return;
        }

        // Keeps what the user was typing before the edit, and restores it after the edit.
        if (!prevId) {
            this._draft = this.state.message;
        }

        const message = id ? this.props.editingMessage?.message ?? '' : this._draft;

        if (!id) {
            this._draft = '';
        }

        this.setState({
            message,
            showSend: Boolean(message)
        });

        // Opens the keyboard on the text to edit.
        id && this._inputRef.current?.focus();
    }

    /**
     * Tracks keyboard visibility (not input focus) so the bar also stays above the keyboard while the
     * search input is focused.
     *
     * @inheritdoc
     */
    override componentDidMount() {
        if (Platform.OS !== 'android') {
            return;
        }

        this._keyboardSubscriptions = [
            Keyboard.addListener('keyboardDidShow', () => this.setState({ addPadding: true })),
            Keyboard.addListener('keyboardDidHide', () => this.setState({ addPadding: false }))
        ];
    }

    /**
     * Implements {@code Component#componentWillUnmount}.
     *
     * @inheritdoc
     */
    override componentWillUnmount() {
        this._keyboardSubscriptions.forEach(subscription => subscription.remove());
        this._keyboardSubscriptions = [];
    }

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    override render() {
        const { t } = this.props;

        if (_isSendDisabled(this.props)) {
            return (
                <View
                    id = 'no-messages-message'
                    style = { styles.disabledSendWrapper as ViewStyle }>
                    <Text style = { styles.emptyComponentText as TextStyle }>
                        { t('chat.disabled') }
                    </Text>
                </View>
            );
        }

        const { editingMessage } = this.props;
        const messageInputLabel = t('chat.fieldPlaceHolder');
        const sendButtonLabel = editingMessage ? t('chat.edit') : t('chat.sendButton');

        return (
            <View>
                { editingMessage && (
                    <View style = { styles.editingBanner as ViewStyle }>
                        <Icon
                            color = { styles.editingBannerTitle.color }
                            size = { 20 }
                            src = { IconEdit } />
                        <View style = { styles.editingBannerText as ViewStyle }>
                            <Text style = { styles.editingBannerTitle as TextStyle }>
                                { t('chat.editingMessage') }
                            </Text>
                            <Text
                                numberOfLines = { 1 }
                                style = { styles.editingBannerMessage as TextStyle }>
                                { editingMessage.message }
                            </Text>
                        </View>
                        <IconButton
                            accessibilityLabel = { t('dialog.Cancel') }
                            onPress = { this._onCancelEdit }
                            src = { IconCloseLarge }
                            type = { BUTTON_TYPES.TERTIARY } />
                    </View>
                ) }
                { this._renderInputBar(messageInputLabel, sendButtonLabel) }
            </View>
        );
    }

    /**
     * Renders the text field and the send button. The button saves the edit in edit mode.
     *
     * @param {string} messageInputLabel - The input label.
     * @param {string} sendButtonLabel - The send button label.
     * @returns {React.ReactElement}
     */
    _renderInputBar(messageInputLabel: string, sendButtonLabel: string) {
        return (
            <View
                id = 'chat-input'
                style = { [
                    styles.inputBar,
                    this.state.addPadding ? styles.extraBarPadding : null
                ] as ViewStyle[] }>
                <Input
                    accessibilityLabel = { messageInputLabel }
                    blurOnSubmit = { false }
                    customStyles = {{ container: styles.customInputContainer }}
                    id = 'chat-input-messagebox'
                    multiline = { false }
                    onChange = { this._onChangeText }
                    onSubmitEditing = { this._onSubmit }
                    placeholder = { messageInputLabel }
                    ref = { this._inputRef }
                    returnKeyType = 'send'
                    value = { this.state.message } />
                <IconButton
                    accessibilityLabel = { sendButtonLabel }
                    disabled = { !this.state.message }
                    id = { sendButtonLabel }
                    onPress = { this._onSubmit }
                    src = { this.props.editingMessage ? IconCheck : IconSend }
                    style = { styles.sendButton }
                    type = { BUTTON_TYPES.PRIMARY } />
            </View>
        );
    }

    /**
     * Leaves edit mode. The draft goes back in the input in componentDidUpdate.
     *
     * @returns {void}
     */
    _onCancelEdit() {
        this.props.onCancelEdit?.();
    }

    /**
     * Callback to handle the change of the value of the text field.
     *
     * @param {string} text - The current value of the field.
     * @returns {void}
     */
    _onChangeText(text: string) {
        this.setState({
            message: text,
            showSend: Boolean(text)
        });
    }

    /**
     * Callback to handle the submit event of the text field.
     *
     * @returns {void}
     */
    _onSubmit() {
        const { onSend } = this.props;

        if (_isSendDisabled(this.props)) {
            return;
        }

        const message = this.state.message.trim();

        message && onSend(message);
        this.setState({
            message: '',
            showSend: false
        });
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    const { aspectRatio } = state['features/base/responsive-ui'];
    const { privateMessageRecipient } = state['features/chat'];

    return {
        _isSendGroupChatDisabled: isSendGroupChatDisabled(state),
        _isSendPrivateChatDisabled: isSendPrivateChatDisabled(state),
        _privateMessageRecipientId: privateMessageRecipient?.id,
        aspectRatio
    };
}

export default translate(connect(_mapStateToProps)(ChatInputBar));
