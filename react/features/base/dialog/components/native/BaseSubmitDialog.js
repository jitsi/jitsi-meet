// @flow

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import { StyleType } from '../../../styles';

import BaseDialog, { type Props as BaseProps } from './BaseDialog';
import {
    brandedDialog
} from './styles';

type Props = BaseProps & {

    /**
     * The color-schemed stylesheet of the feature.
     */
    _dialogStyles: StyleType,

    t: Function
}

/**
 * Abstract dialog to submit something. E.g. a confirmation or a form.
 */
class BaseSubmitDialog<P: Props, S: *> extends BaseDialog<P, S> {
    /**
     * Returns the title key of the submit button.
     *
     * NOTE: Please do not change this, this should be consistent accross the
     * application. This method is here to be able to be overriden ONLY by the
     * {@code ConfirmDialog}.
     *
     * @returns {string}
     */
    _getSubmitButtonKey() {
        return 'dialog.Ok';
    }

    /**
     * Renders additional buttons, if any - may be overwritten by children.
     *
     * @returns {?ReactElement}
     */
    _renderAdditionalButtons() {
        return null;
    }

    /**
     * Implements {@code BaseDialog._renderContent}.
     *
     * @inheritdoc
     */
    _renderContent() {
        const { _dialogStyles, t } = this.props;
        const additionalButtons = this._renderAdditionalButtons();

        return (
            <View>
                <View style = { brandedDialog.mainWrapper }>
                    { this._renderSubmittable() }
                </View>
                <View style = { brandedDialog.buttonWrapper }>
                    { additionalButtons }
                    <TouchableOpacity
                        disabled = { this.props.okDisabled }
                        onPress = { this._onSubmit }
                        style = { [
                            _dialogStyles.button,
                            additionalButtons
                                ? null : brandedDialog.buttonFarLeft,
                            brandedDialog.buttonFarRight
                        ] }>
                        <Text style = { _dialogStyles.buttonLabel }>
                            { t(this._getSubmitButtonKey()) }
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    _onCancel: () => void;

    _onSubmit: () => boolean;

    _renderHTML: string => Object | string

    /**
     * Renders the actual content of the dialog defining what is about to be
     * submitted. E.g. a simple confirmation (text, properly wrapped) or a
     * complex form.
     *
     * @returns {Object}
     */
    _renderSubmittable: () => Object
}

export default BaseSubmitDialog;
