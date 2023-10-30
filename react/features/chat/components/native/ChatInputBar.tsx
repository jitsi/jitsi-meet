import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { Platform, View, ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconSend } from '../../../base/icons/svg';
import { ASPECT_RATIO_WIDE } from '../../../base/responsive-ui/constants';
import IconButton from '../../../base/ui/components/native/IconButton';
import Input from '../../../base/ui/components/native/Input';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';

import styles from './styles';


interface IProps extends WithTranslation {

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
    render() {
        let inputBarStyles;

        if (this.props.aspectRatio === ASPECT_RATIO_WIDE) {
            inputBarStyles = styles.inputBarWide;
        } else {
            inputBarStyles = styles.inputBarNarrow;
        }

        return (
            <View
                style = { [
                    inputBarStyles,
                    this.state.addPadding ? styles.extraBarPadding : null
                ] as ViewStyle[] }>
                <Input
                    blurOnSubmit = { false }
                    customStyles = {{ container: styles.customInputContainer }}
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
                    onPress = { this._onSubmit }
                    src = { IconSend }
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
        const message = this.state.message.trim();

        message && this.props.onSend(message);
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

    return {
        aspectRatio
    };
}

export default translate(connect(_mapStateToProps)(ChatInputBar));
