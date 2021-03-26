// @flow

import React from 'react';
import { Text } from 'react-native';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { ConfirmDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { StyleType } from '../../../base/styles';
import AbstractMuteEveryonesVideoDialog, {
    abstractMapStateToProps,
    type Props as AbstractProps } from '../AbstractMuteEveryonesVideoDialog';

type Props = AbstractProps & {

    /**
     * The color-schemed stylesheet of the base/dialog feature.
     */
    _dialogStyles: StyleType
}

/**
 * A React Component with the contents for a dialog that asks for confirmation
 * from the user before muting all remote participants.
 *
 * @extends AbstractMuteEveryoneDialog
 */
class MuteEveryonesVideoDialog extends AbstractMuteEveryonesVideoDialog<Props> {

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <ConfirmDialog
                okKey = 'dialog.muteEveryonesVideoDialogOk'
                onSubmit = { this._onSubmit } >
                <Text style = { this.props._dialogStyles.text }>
                    { `${this.props.title} \n\n ${this.props.content}` }
                </Text>
            </ConfirmDialog>
        );
    }

    _onSubmit: () => boolean;
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the component.
 * @returns {{
    *     _dialogStyles: StyleType
    * }}
 */
function _mapStateToProps(state: Object, ownProps: Props) {
    return {
        ...abstractMapStateToProps(state, ownProps),
        _dialogStyles: ColorSchemeRegistry.get(state, 'Dialog')
    };
}

export default translate(connect(_mapStateToProps)(MuteEveryonesVideoDialog));
