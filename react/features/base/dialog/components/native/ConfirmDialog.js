// @flow

import React from 'react';
import { View } from 'react-native';
import Dialog from 'react-native-dialog';

import { translate } from '../../../i18n';
import { connect } from '../../../redux';
import AbstractDialog from '../AbstractDialog';
import { renderHTML } from '../functions.native';

import styles from './styles';


/**
 * The type of the React {@code Component} props of
 * {@link ConfirmDialog}.
 */
type Props = {

    /**
     * The i18n key of the text label for the cancel button.
     */
    cancelLabel: string,

    /**
     * The React {@code Component} children.
     */
    children?: React$Node,

    /**
     * The i18n key of the text label for the confirm button.
     */
    confirmLabel: string,

    /**
     * Dialog description key for translations.
     */
    descriptionKey?: string | Object,

    /**
     * Whether or not the nature of the confirm button is destructive.
     */
    isConfirmDestructive?: Boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * Dialog title.
     */
    title?: string,
};

/**
 * React Component for getting confirmation to stop a file recording session in
 * progress.
 *
 * @augments Component
 */
class ConfirmDialog extends AbstractDialog<Props> {
    /**
     * Default values for {@code ConfirmDialog} component's properties.
     *
     * @static
     */
    static defaultProps = {
        isConfirmDestructive: false
    };

    /**
     * Renders the dialog description.
     *
     * @returns {React$Component}
     */
    _renderDescription() {
        const { descriptionKey, t } = this.props;
        const description
            = typeof descriptionKey === 'string'
                ? t(descriptionKey)
                : renderHTML(
                    t(descriptionKey?.key, descriptionKey?.params)
                );

        return (
            <Dialog.Description>
                { description }
            </Dialog.Description>
        );
    }

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const {
            cancelLabel,
            children,
            confirmLabel,
            isConfirmDestructive,
            t,
            title
        } = this.props;

        const dialogButtonStyle
            = isConfirmDestructive
                ? styles.destructiveDialogButton : styles.dialogButton;

        return (
            <View>
                <Dialog.Container visible = { true }>
                    {
                        title && <Dialog.Title>
                            { t(title) }
                        </Dialog.Title>
                    }
                    { this._renderDescription() }
                    { children }
                    <Dialog.Button
                        label = { t(cancelLabel || 'dialog.confirmNo') }
                        onPress = { this._onCancel }
                        style = { styles.dialogButton } />
                    <Dialog.Button
                        label = { t(confirmLabel || 'dialog.confirmYes') }
                        onPress = { this._onSubmit }
                        style = { dialogButtonStyle } />
                </Dialog.Container>
            </View>
        );
    }

    _onCancel: () => void;

    _onSubmit: (?string) => void;
}

export default translate(connect()(ConfirmDialog));
