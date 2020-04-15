// @flow

import React from 'react';

import { ConfirmDialog } from '../../../base/dialog';
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
        return (
            <ConfirmDialog
                contentKey = 'lobby.disableDialogContent'
                onSubmit = { this._onDisableLobbyMode } />
        );
    }

    _onDisableLobbyMode: () => void;
}

export default translate(connect()(DisableLobbyModeDialog));
