// @flow

import React, { Component } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';

import { Icon, IconChatSend } from '../../../base/icons';
import { Platform } from '../../../base/react';

import styles from './styles';

type Props = {

    /**
     * Callback to invoke on message send.
     */
    onSend: Function
};

type State = {

    /**
     * Boolean to show if an extra padding needs to be added to the bar.
     */
    addPadding: boolean,

    /**
     * The value of the input field.
     */
    message: string,

    /**
     * Boolean to show or hide the send button.
     */
    showSend: boolean
};

/**
 * Implements the chat input bar with text field and action(s).
 */
export default class ChatInputBar extends Component<Props, State> {
    /**
     * Instantiates a new instance of the component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
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
    render() {
        return (
            <View
                style = { [
                    styles.inputBar,
                    this.state.addPadding ? styles.extraBarPadding : null
                ] }>
                <TextInput
                    blurOnSubmit = { false }
                    multiline = { false }
                    onBlur = { this._onFocused(false) }
                    onChangeText = { this._onChangeText }
                    onFocus = { this._onFocused(true) }
                    onSubmitEditing = { this._onSubmit }
                    returnKeyType = 'send'
                    style = { styles.inputField }
                    value = { this.state.message } />
                {
                    this.state.showSend && <TouchableOpacity onPress = { this._onSubmit }>
                        <Icon
                            src = { IconChatSend }
                            style = { styles.sendButtonIcon } />
                    </TouchableOpacity>
                }
            </View>
        );
    }

    _onChangeText: string => void;

    /**
     * Callback to handle the change of the value of the text field.
     *
     * @param {string} text - The current value of the field.
     * @returns {void}
     */
    _onChangeText(text) {
        this.setState({
            message: text,
            showSend: Boolean(text)
        });
    }

    _onFocused: boolean => Function;

    /**
     * Constructs a callback to be used to update the padding of the field if necessary.
     *
     * @param {boolean} focused - True of the field is focused.
     * @returns {Function}
     */
    _onFocused(focused) {
        return () => {
            Platform.OS === 'android' && this.setState({
                addPadding: focused
            });
        };
    }

    _onSubmit: () => void;

    /**
     * Callback to handle the submit event of the text field.
     *
     * @returns {void}
     */
    _onSubmit() {
        const message = this.state.message.trim();

        message && this.props.onSend(message);
        this.setState({
            message: '',
            showSend: false
        });
    }
}
