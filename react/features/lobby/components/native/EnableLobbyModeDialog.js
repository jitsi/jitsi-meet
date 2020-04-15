// @flow

import React from 'react';
import { Text, TextInput, View } from 'react-native';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { CustomSubmitDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { StyleType } from '../../../base/styles';
import AbstractEnableLobbyModeDialog, { type Props as AbstractProps } from '../AbstractEnableLobbyModeDialog';

import styles from './styles';

type Props = AbstractProps & {

    /**
     * Color schemed common style of the dialog feature.
     */
    _dialogStyles: StyleType
};

/**
 * Implements a dialog that lets the user enable the lobby mode.
 */
class EnableLobbyModeDialog extends AbstractEnableLobbyModeDialog<Props> {
    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
        const { _dialogStyles, t } = this.props;

        return (
            <CustomSubmitDialog
                okKey = 'lobby.enableDialogSubmit'
                onSubmit = { this._onEnableLobbyMode }
                titleKey = 'lobby.dialogTitle'>
                <View style = { styles.formWrapper }>
                    <Text>
                        { t('lobby.enableDialogText') }
                    </Text>
                    <View style = { styles.fieldRow }>
                        <Text>
                            { t('lobby.enableDialogPasswordField') }
                        </Text>
                        <TextInput
                            autoCapitalize = 'none'
                            autoCompleteType = 'off'
                            onChangeText = { this._onChangePassword }
                            secureTextEntry = { true }
                            style = { _dialogStyles.field } />
                    </View>
                </View>
            </CustomSubmitDialog>
        );
    }

    _onChangePassword: Object => void;

    _onEnableLobbyMode: () => void;
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function _mapStateToProps(state: Object): Object {
    return {
        _dialogStyles: ColorSchemeRegistry.get(state, 'Dialog')
    };
}

export default translate(connect(_mapStateToProps)(EnableLobbyModeDialog));
