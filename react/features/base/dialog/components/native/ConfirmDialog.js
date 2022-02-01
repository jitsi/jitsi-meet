// @flow

import React from 'react';
import { View } from 'react-native';
import Dialog from 'react-native-dialog';
import { Text } from 'react-native-paper';

import { translate } from '../../../i18n';
import { connect } from '../../../redux';

import BaseDialog, { type Props as BaseProps } from './BaseDialog';
import styles from './styles';


/**
 * The type of the React {@code Component} props of
 * {@link ConfirmDialog}.
 */
type Props = BaseProps & {

    /**
     * The React {@code Component} children which represents the dialog's body.
     */
    children: ?React$Node,

    /**
     * Dialog description key for translations.
     */
    descriptionKey?: string,

    /**
     * The i18n key of the text label for the cancel button.
     */
    cancelLabel: string,

    /**
     * The i18n key of the text label for the confirm button.
     */
    confirmLabel: string,

    /**
     * Callback to invoke when cancel button is clicked/pressed.
     */
    onCancel: Function,

    /**
     * Callback to invoke when submit button is clicked/pressed.
     */
    onSubmit: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * React Component for getting confirmation to stop a file recording session in
 * progress.
 *
 * @augments Component
 */
class ConfirmDialog<P: Props> extends BaseDialog<Props> {
    /**
     * Initializes a new {@code ConfirmDialog} instance.
     *
     * @inheritdoc
     */
    constructor(props: P) {
        super(props);

        this.state = {
            visible: true
        };

        // Bind event handler so it is only bound once for every instance.
        this._onCancel = this._onCancel.bind(this);
        this._onConfirm = this._onConfirm.bind(this);
    }

    _onCancel: () => void;

    /**
     * Callback to cancel button.
     *
     * @private
     * @returns {void}
     */
    _onCancel() {
        const { onCancel } = this.props;

        onCancel && onCancel();

        this.setState({
            visible: !this.state.visible
        });
    }

    _onConfirm: () => void;

    /**
     * Callback for the confirm button.
     *
     * @private
     * @returns {void}.
     */
    _onConfirm() {
        const { onSubmit } = this.props;

        onSubmit && onSubmit();

        this.setState({
            visible: !this.state.visible
        });
    }

    /**
     * Renders the dialog description.
     *
     * @returns {React$Component}
     */
    _renderDescription() {
        const { children, descriptionKey, t } = this.props;
        const description
            = typeof descriptionKey === 'string'
                ? t(descriptionKey)
                : this._renderHTML(
                    t(descriptionKey?.key, descriptionKey?.params)
                );

        return (
            <>
                <Text style = { styles.dialogDescription }>
                    { description }
                </Text>
                <Text style = { styles.dialogDescription }>
                    { children }
                </Text>
            </>
        );
    }

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { cancelLabel, confirmLabel, t } = this.props;
        const { visible } = this.state;

        return (
            <View>
                <Dialog.Container
                    visible = { visible }>
                    { this._renderDescription() }
                    <Dialog.Button
                        label = { t(cancelLabel || 'dialog.confirmNo') }
                        onPress = { this._onCancel }
                        style = { styles.dialogButton } />
                    <Dialog.Button
                        label = { t(confirmLabel || 'dialog.confirmYes') }
                        onPress = { this._onConfirm }
                        style = { styles.dialogButton } />
                </Dialog.Container>
            </View>
        );
    }
}

export default translate(connect()(ConfirmDialog));
