// @flow

import React from 'react';
import { View } from 'react-native';
import Dialog from 'react-native-dialog';

import { translate } from '../../../i18n';
import { connect } from '../../../redux';
import { _abstractMapStateToProps } from '../../functions';
import AbstractDialog, {
    type Props as AbstractProps,
    type State as AbstractState
} from '../AbstractDialog';

import { inputDialog as styles } from './styles';

type Props = AbstractProps & {

    /**
     * The dialog descriptionKey.
     */
    descriptionKey: string,

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
            submitting: false
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
            descriptionKey,
            messageKey,
            t,
            titleKey
        } = this.props;

        return (
            <View>
                <Dialog.Container
                    visible = { true }>
                    <Dialog.Title>
                        { t(titleKey) }
                    </Dialog.Title>
                    {
                        descriptionKey && (
                            <Dialog.Description>
                                { t(descriptionKey) }
                            </Dialog.Description>
                        )
                    }
                    <Dialog.Input
                        autoFocus = { true }
                        onChangeText = { this._onChangeText }
                        value = { this.state.fieldValue }
                        { ...this.props.textInputProps } />
                    {
                        messageKey && (
                            <Dialog.Description
                                style = { styles.formMessage }>
                                { t(messageKey) }
                            </Dialog.Description>
                        )
                    }
                    <Dialog.Button
                        label = { t('dialog.Cancel') }
                        onPress = { this._onCancel } />
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
        if (this.props.validateInput && !this.props.validateInput(fieldValue)) {
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
