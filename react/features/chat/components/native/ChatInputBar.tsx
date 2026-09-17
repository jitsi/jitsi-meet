import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { Platform, TextStyle, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconSend } from '../../../base/icons/svg';
import IconButton from '../../../base/ui/components/native/IconButton';
import Input from '../../../base/ui/components/native/Input';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import { isSendGroupChatDisabled, isSendPrivateChatDisabled } from '../../functions';

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

        this._onChangeText = this._onChangeText.bind(this);
        this._onFocused = this._onFocused.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
    }

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    override render() {
        if (_isSendDisabled(this.props)) {
            return (
                <View
                    id = 'no-messages-message'
                    style = { styles.disabledSendWrapper as ViewStyle }>
                    <Text style = { styles.emptyComponentText as TextStyle }>
                        { this.props.t('chat.disabled') }
                    </Text>
                </View>
            );
        }

        return (
            <View
                id = 'chat-input'
                style = { [
                    styles.inputBar,
                    this.state.addPadding ? styles.extraBarPadding : null
                ] as ViewStyle[] }>
                <Input
                    blurOnSubmit = { false }
                    customStyles = {{ container: styles.customInputContainer }}
                    id = 'chat-input-messagebox'
                    multiline = { false }
                    onBlur = { this._onFocused(false) }
                    onChange = { this._onChangeText }
                    onFocus = { this._onFocused(true) }
                    onSubmitEditing = { this._onSubmit }
                    placeholder = { this.props.t('chat.fieldPlaceHolder') }
                    returnKeyType = 'send'
                    value = { this.state.message } />
                <IconButton
                    disabled = { !this.state.message }
                    id = { this.props.t('chat.sendButton') }
                    onPress = { this._onSubmit }
                    src = { IconSend }
                    style = { styles.sendButton }
                    type = { BUTTON_TYPES.PRIMARY } />
            </View>
        );
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
     * Constructs a callback to be used to update the padding of the field if necessary.
     *
     * @param {boolean} focused - True of the field is focused.
     * @returns {Function}
     */
    _onFocused(focused: boolean) {
        return () => {
            Platform.OS === 'android' && this.setState({
                addPadding: focused
            });
        };
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
