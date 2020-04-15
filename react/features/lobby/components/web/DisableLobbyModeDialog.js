// @flow

import React from 'react';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import AbstractDisableLobbyModeDialog from '../AbstractDisableLobbyModeDialog';

/**
 * Implements a dialog that lets the user disable the lobby mode.
 */
class DisableLobbyModeDialog extends AbstractDisableLobbyModeDialog {
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
                okKey = 'lobby.disableDialogSubmit'
                onSubmit = { this._onDisableLobbyMode }
                titleKey = 'lobby.dialogTitle'>
                { t('lobby.disableDialogContent') }
            </Dialog>
        );
    }

    _onDisableLobbyMode: () => void;
}

export default translate(connect()(DisableLobbyModeDialog));
