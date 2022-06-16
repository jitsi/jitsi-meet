// @flow

import React from 'react';

import { ConfirmDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import AbstractKickRemoteParticipantDialog
    from '../AbstractKickRemoteParticipantDialog';

/**
 * Dialog to confirm a remote participant kick action.
 */
class KickRemoteParticipantDialog extends AbstractKickRemoteParticipantDialog {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <ConfirmDialog
                cancelLabel = 'dialog.Cancel'
                confirmLabel = 'dialog.kickParticipantButton'
                descriptionKey = 'dialog.kickParticipantDialog'
                isConfirmDestructive = { true }
                onSubmit = { this._onSubmit }
                title = 'dialog.kickParticipantTitle' />
        );
    }

    _onSubmit: () => boolean;
}

export default translate(connect()(KickRemoteParticipantDialog));
