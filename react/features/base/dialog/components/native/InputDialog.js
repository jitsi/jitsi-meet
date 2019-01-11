// @flow

import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { connect } from 'react-redux';

import { translate } from '../../../i18n';

import { type State as AbstractState } from '../AbstractDialog';

import BaseDialog, { type Props as BaseProps } from './BaseDialog';
import {
    FIELD_UNDERLINE,
    brandedDialog,
    inputDialog as styles
} from './styles';

type Props = {
    ...BaseProps,

    /**
     * The untranslated i18n key for the field label on the dialog.
     */
    contentKey: string,

    t: Function,

    textInputProps: ?Object
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
            fieldValue: undefined
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
        const { okDisabled, t } = this.props;

        return (
            <View>
                <View
                    style = { [
                        brandedDialog.mainWrapper,
                        styles.fieldWrapper
                    ] }>
                    <Text style = { styles.fieldLabel }>
                        { t(this.props.contentKey) }
                    </Text>
                    <TextInput
                        onChangeText = { this._onChangeText }
                        style = { styles.field }
                        underlineColorAndroid = { FIELD_UNDERLINE }
                        value = { this.state.fieldValue }
                        { ...this.props.textInputProps } />
                </View>
                <View style = { brandedDialog.buttonWrapper }>
                    <TouchableOpacity
                        disabled = { okDisabled }
                        onPress = { this._onSubmitValue }
                        style = { [
                            brandedDialog.button,
                            brandedDialog.buttonFarLeft,
                            brandedDialog.buttonFarRight
                        ] }>
                        <Text style = { brandedDialog.text }>
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

export default translate(connect()(InputDialog));
