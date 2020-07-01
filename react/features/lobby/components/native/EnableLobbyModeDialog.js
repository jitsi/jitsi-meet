// @flow

import React, { PureComponent } from 'react';
import { Text, View } from 'react-native';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { CustomSubmitDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { toggleLobbyMode } from '../../actions';

import styles from './styles';

type Props = {

    /**
     * The Redux Dispatch function.
     */
    dispatch: Function,

    /**
     * Function to be used to translate i18n labels.
     */
    t: Function
};

/**
 * Implements a dialog that lets the user enable the lobby mode.
 */
class EnableLobbyModeDialog extends PureComponent<Props> {
    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onEnableLobbyMode = this._onEnableLobbyMode.bind(this);
    }

    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <CustomSubmitDialog
                okKey = 'lobby.enableDialogSubmit'
                onSubmit = { this._onEnableLobbyMode }
                titleKey = 'lobby.dialogTitle'>
                <View style = { styles.formWrapper }>
                    <Text>
                        { this.props.t('lobby.enableDialogText') }
                    </Text>
                </View>
            </CustomSubmitDialog>
        );
    }

    _onEnableLobbyMode: () => void;

    /**
     * Callback to be invoked when the user initiates the lobby mode enable flow.
     *
     * @returns {void}
     */
    _onEnableLobbyMode() {
        this.props.dispatch(toggleLobbyMode(true));

        return true;
    }
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
