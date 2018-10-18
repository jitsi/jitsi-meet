// @flow

import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { connect } from 'react-redux';

import { translate } from '../../../i18n';

import { type Props as BaseProps } from './BaseDialog';
import BaseSubmitDialog from './BaseSubmitDialog';
import { brandedDialog } from './styles';

type Props = {
    ...BaseProps,

    /**
     * Untranslated i18n key of the content to be displayed.
     *
     * NOTE: This dialog also adds support to Object type keys that will be
     * translated using the provided params. See i18n function
     * {@code translate(string, Object)} for more details.
     */
    contentKey: string | { key: string, params: Object},

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
        return 'dialog.confirmYes';
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
        const { t } = this.props;

        return (
            <TouchableOpacity
                onPress = { this._onCancel }
                style = { [
                    brandedDialog.button,
                    brandedDialog.buttonFarLeft,
                    brandedDialog.buttonSeparator
                ] }>
                <Text style = { brandedDialog.text }>
                    { t('dialog.confirmNo') }
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
        const { contentKey, t } = this.props;
        const content
            = typeof contentKey === 'string'
                ? t(contentKey)
                : this._renderHTML(t(contentKey.key, contentKey.params));

        return (
            <Text style = { brandedDialog.text }>
                { content }
            </Text>
        );
    }

    _renderHTML: string => Object | string
}

export default translate(connect()(ConfirmDialog));
