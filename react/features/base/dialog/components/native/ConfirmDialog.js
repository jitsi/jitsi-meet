// @flow

import React from 'react';
import { Platform, View } from 'react-native';
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

        let rightLabel;
        let leftLabel;
        let rightOnPress;
        let leftOnPress;
        let rightStyle;
        let leftStyle;

        if (Platform.OS === 'android') {
            rightLabel = confirmLabel || 'dialog.confirmYes';
            rightOnPress = () => this._onSubmit();
            rightStyle = dialogButtonStyle;
            leftLabel = cancelLabel || 'dialog.confirmNo';
            leftOnPress = () => this._onCancel();
            leftStyle = styles.dialogButton;
        } else {
            rightLabel = cancelLabel || 'dialog.confirmNo';
            rightOnPress = () => this._onCancel();
            rightStyle = styles.dialogButton;
            leftLabel = confirmLabel || 'dialog.confirmYes';
            leftOnPress = () => this._onSubmit();
            leftStyle = dialogButtonStyle;
        }

        return (
            <View>
                <Dialog.Container
                    visible = { true }>
                    {
                        title && <Dialog.Title>
                            { t(title) }
                        </Dialog.Title>
                    }
                    { this._renderDescription() }
                    { children }
                    <Dialog.Button
                        label = { t(rightLabel) }
                        onPress = { rightOnPress }
                        style = { rightStyle } />
                    <Dialog.Button
                        label = { t(leftLabel) }
                        onPress = { leftOnPress }
                        style = { leftStyle } />
                </Dialog.Container>
            </View>
        );
    }

    _onCancel: () => void;

    _onSubmit: (?string) => void;
}

export default translate(connect()(ConfirmDialog));
