import React from 'react';
import { WithTranslation } from 'react-i18next';
import { TextStyle } from 'react-native';
import Dialog from 'react-native-dialog';
import { connect } from 'react-redux';

import { translate } from '../../../i18n/functions';
import { _abstractMapStateToProps } from '../../functions';

import AbstractDialog, {
    IProps as AbstractProps,
    IState as AbstractState
} from './AbstractDialog';
import { inputDialog as styles } from './styles';

interface IProps extends AbstractProps, WithTranslation {

    /**
     * The dialog descriptionKey.
     */
    descriptionKey?: string;

    /**
     * Whether to display the cancel button.
     */
    disableCancel?: boolean;

    /**
     * An optional initial value to initiate the field with.
     */
    initialValue?: string;

    /**
     * A message key to be shown for the user (e.g. An error that is defined after submitting the form).
     */
    messageKey?: string;

    /**
     * Props for the text input.
     */
    textInputProps?: Object;

    /**
     * The untranslated i18n key for the dialog title.
     */
    titleKey?: string;

    /**
     * Validating of the input.
     */
    validateInput?: Function;
}

interface IState extends AbstractState {

    /**
     * The current value of the field.
     */
    fieldValue?: string;

    /**
     * The result of the input validation.
     */
    isValid: boolean;
}

/**
 * Implements a single field input dialog component.
 */
class InputDialog extends AbstractDialog<IProps, IState> {
    /**
     * Instantiates a new {@code InputDialog}.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this.state = {
            fieldValue: props.initialValue,
            isValid: props.validateInput ? props.validateInput(props.initialValue) : true,
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
    override render() {
        const {
            descriptionKey,
            messageKey,
            t,
            titleKey
        } = this.props;

        return (
            <Dialog.Container
                coverScreen = { false }
                visible = { true }>
                <Dialog.Title>
                    { t(titleKey ?? '') }
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
                            style = { styles.formMessage as TextStyle }>
                            { t(messageKey) }
                        </Dialog.Description>
                    )
                }
                {!this.props.disableCancel && <Dialog.Button
                    label = { t('dialog.Cancel') }
                    onPress = { this._onCancel } />}
                <Dialog.Button
                    disabled = { !this.state.isValid }
                    label = { t('dialog.Ok') }
                    onPress = { this._onSubmitValue } />
            </Dialog.Container>
        );
    }

    /**
     * Callback to be invoked when the text in the field changes.
     *
     * @param {string} fieldValue - The updated field value.
     * @returns {void}
     */
    _onChangeText(fieldValue: string) {
        if (this.props.validateInput) {
            this.setState({
                isValid: this.props.validateInput(fieldValue),
                fieldValue
            });

            return;
        }
        this.setState({
            fieldValue
        });
    }

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
