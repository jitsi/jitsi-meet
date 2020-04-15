// @flow

import React from 'react';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import AbstractEnableLobbyModeDialog from '../AbstractEnableLobbyModeDialog';

/**
 * Implements a dialog that lets the user enable the lobby mode.
 */
class EnableLobbyModeDialog extends AbstractEnableLobbyModeDialog {
    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
        const { t } = this.props;

        return (
            <Dialog
                className = 'lobby-screen'
                okKey = 'lobby.enableDialogSubmit'
                onSubmit = { this._onEnableLobbyMode }
                titleKey = 'lobby.dialogTitle'>
                <div id = 'lobby-dialog'>
                    <span className = 'description'>
                        { t('lobby.enableDialogText') }
                    </span>
                    <div className = 'field'>
                        <label htmlFor = 'password'>
                            { t('lobby.enableDialogPasswordField') }
                        </label>
                        <input
                            onChange = { this._onChangePassword }
                            type = 'password'
                            value = { this.state.password } />
                    </div>
                </div>
            </Dialog>
        );
    }

    _onChangePassword: Object => void;

    _onEnableLobbyMode: () => void;
}

export default translate(connect()(EnableLobbyModeDialog));
