// @flow

import React from 'react';
import { View, Text } from 'react-native';
import Dialog from 'react-native-dialog';

import { translate } from '../../../i18n';
import { connect } from '../../../redux';
import { StyleType } from '../../../styles';
import { _abstractMapStateToProps } from '../../functions';
import AbstractDialog, {
    type Props as AbstractProps,
    type State as AbstractState
} from '../AbstractDialog';

import { FIELD_UNDERLINE, inputDialog as styles } from './styles';

type Props = AbstractProps & {

    /**
     * The color-schemed stylesheet of the feature.
     */
    _dialogStyles: StyleType,

    /**
     * The untranslated i18n key for the dialog content.
     */
    contentKey: string,

    /**
     * An optional initial value to initiate the field with.
     */
    initialValue?: ?string,

    /**
     * A message key to be shown for the user (e.g. An error that is defined after submitting the form).
     */
    messageKey?: string,

    /**
     * The translate function.
     */
    t: Function,

    /**
     * Props for the text input.
     */
    textInputProps: ?Object,

    /**
     * The untranslated i18n key for the dialog title.
     */
    titleKey?: string,

    /**
     * Validating of the input.
     */
    validateInput: ?Function
}

type State = AbstractState & {

    /**
     * The current value of the field.
     */
    fieldValue: ?string
};

/**
 * Implements a single field input dialog component.
 */
class InputDialog<P: Props, S: State> extends AbstractDialog<P, S> {
    /**
     * Instantiates a new {@code InputDialog}.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            fieldValue: props.initialValue,
            submitting: false,
            visible: true
        };

        this._onChangeText = this._onChangeText.bind(this);
        this._onSubmitValue = this._onSubmitValue.bind(this);
    }

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const {
            _dialogStyles,
            contentKey,
            messageKey,
            t,
            titleKey
        } = this.props;
        const { visible } = this.state;

        return (
            <View>
                <Dialog.Container
                    onBackdropPress = { this._onCancel }
                    visible = { visible }>
                    {
                        titleKey && (
                            <Dialog.Title>
                                { t(titleKey) }
                            </Dialog.Title>
                        )
                    }
                    {
                        contentKey && (
                            <Text
                                style = { styles.content }>
                                { t(contentKey) }
                            </Text>
                        )
                    }
                    <Dialog.Input
                        autoFocus = { true }
                        onChangeText = { this._onChangeText }
                        underlineColorAndroid = { FIELD_UNDERLINE }
                        value = { this.state.inputField }
                        { ...this.props.textInputProps } />
                    {
                        messageKey && (
                            <Text
                                style = { [
                                    styles.formMessage,
                                    _dialogStyles.text
                                ] }>
                                { t(messageKey) }
                            </Text>
                        )
                    }
                    <Dialog.Button
                        label = { t('dialog.Ok') }
                        onPress = { this._onSubmitValue } />
                </Dialog.Container>
            </View>
        );
    }

    _onCancel: () => void;

    _onChangeText: string => void;

    /**
     * Callback to be invoked when the text in the field changes.
     *
     * @param {string} fieldValue - The updated field value.
     * @returns {void}
     */
    _onChangeText(fieldValue) {

        if (this.props.validateInput
            && !this.props.validateInput(fieldValue)) {
            return;
        }

        this.setState({
            fieldValue
        });
    }

    _onSubmit: (?string) => boolean;

    _onSubmitValue: () => boolean;

    /**
     * Callback to be invoked when the value of this dialog is submitted.
     *
     * @returns {boolean}
     */
    _onSubmitValue() {
        return this._onSubmit(this.state.fieldValue);
    }
}

export default translate(connect(_abstractMapStateToProps)(InputDialog));
