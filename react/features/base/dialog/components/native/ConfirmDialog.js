// @flow

import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

import { translate } from '../../../i18n';
import { connect } from '../../../redux';
import { StyleType } from '../../../styles';
import { _abstractMapStateToProps } from '../../functions';

import { type Props as BaseProps } from './BaseDialog';
import BaseSubmitDialog from './BaseSubmitDialog';
import { brandedDialog } from './styles';

type Props = BaseProps & {

    /**
     * The color-schemed stylesheet of the feature.
     */
    _dialogStyles: StyleType,

    /**
     * Untranslated i18n key of the content to be displayed.
     *
     * NOTE: This dialog also adds support to Object type keys that will be
     * translated using the provided params. See i18n function
     * {@code translate(string, Object)} for more details.
     */
    contentKey: string | { key: string, params: Object},

    /**
     * The handler for the event when clicking the 'confirmNo' button.
     * Defaults to onCancel if absent.
     */
    onDecline?: Function,

    t: Function
}

/**
 * Implements a confirm dialog component.
 */
class ConfirmDialog extends BaseSubmitDialog<Props, *> {
    /**
     * Returns the title key of the submit button.
     *
     * @returns {string}
     */
    _getSubmitButtonKey() {
        return this.props.okKey || 'dialog.confirmYes';
    }

    _onCancel: () => void;

    /**
     * Renders the 'No' button.
     *
     * NOTE: The {@code ConfirmDialog} is the only dialog right now that
     * renders 2 buttons, mainly for clarity.
     *
     * @inheritdoc
     */
    _renderAdditionalButtons() {
        const { _dialogStyles, cancelKey, onDecline, t } = this.props;

        return (
            <TouchableOpacity
                onPress = { onDecline || this._onCancel }
                style = { [
                    _dialogStyles.button,
                    brandedDialog.buttonFarLeft,
                    _dialogStyles.buttonSeparator
                ] }>
                <Text style = { _dialogStyles.buttonLabel }>
                    { t(cancelKey || 'dialog.confirmNo') }
                </Text>
            </TouchableOpacity>
        );
    }

    /**
     * Implements {@code BaseSubmitDialog._renderSubmittable}.
     *
     * @inheritdoc
     */
    _renderSubmittable() {
        if (this.props.children) {
            return this.props.children;
        }

        const { _dialogStyles, contentKey, t } = this.props;
        const content
            = typeof contentKey === 'string'
                ? t(contentKey)
                : this._renderHTML(t(contentKey.key, contentKey.params));

        return (
            <Text style = { _dialogStyles.text }>
                { content }
            </Text>
        );
    }

    _renderHTML: string => Object | string;
}

export default translate(connect(_abstractMapStateToProps)(ConfirmDialog));
