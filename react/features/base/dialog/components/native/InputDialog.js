// @flow

import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';

import { translate } from '../../../i18n';
import { connect } from '../../../redux';
import { StyleType } from '../../../styles';
import { _abstractMapStateToProps } from '../../functions';
import { type State as AbstractState } from '../AbstractDialog';

import BaseDialog, { type Props as BaseProps } from './BaseDialog';
import {
    FIELD_UNDERLINE,
    brandedDialog,
    inputDialog as styles
} from './styles';

type Props = BaseProps & {

    /**
     * The color-schemed stylesheet of the feature.
     */
    _dialogStyles: StyleType,

    /**
     * The untranslated i18n key for the field label on the dialog.
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

    t: Function,

    textInputProps: ?Object,

    /**
     * Validating of the input.
     */
    validateInput: ?Function
}

type State = {
    ...AbstractState,

    /**
     * The current value of the field.
     */
    fieldValue: ?string
};

/**
 * Implements a single field input dialog component.
 */
class InputDialog extends BaseDialog<Props, State> {
    /**
     * Instantiates a new {@code InputDialog}.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            fieldValue: props.initialValue
        };

        this._onChangeText = this._onChangeText.bind(this);
        this._onSubmitValue = this._onSubmitValue.bind(this);
    }

    /**
     * Implements {@code BaseDialog._renderContent}.
     *
     * @inheritdoc
     */
    _renderContent() {
        const { _dialogStyles, messageKey, okDisabled, t } = this.props;

        return (
            <View>
                <View
                    style = { [
                        brandedDialog.mainWrapper,
                        styles.fieldWrapper
                    ] }>
                    <Text style = { _dialogStyles.fieldLabel }>
                        { t(this.props.contentKey) }
                    </Text>
                    <TextInput
                        autoFocus = { true }
                        onChangeText = { this._onChangeText }
                        style = { _dialogStyles.field }
                        underlineColorAndroid = { FIELD_UNDERLINE }
                        value = { this.state.fieldValue }
                        { ...this.props.textInputProps } />
                    { messageKey && (<Text
                        style = { [
                            styles.formMessage,
                            _dialogStyles.text
                        ] }>
                        { t(messageKey) }
                    </Text>) }
                </View>
                <View style = { brandedDialog.buttonWrapper }>
                    <TouchableOpacity
                        disabled = { okDisabled }
                        onPress = { this._onSubmitValue }
                        style = { [
                            _dialogStyles.button,
                            brandedDialog.buttonFarLeft,
                            brandedDialog.buttonFarRight
                        ] }>
                        <Text style = { _dialogStyles.buttonLabel }>
                            { t('dialog.Ok') }
                        </Text>
                    </TouchableOpacity>
                </View>
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
