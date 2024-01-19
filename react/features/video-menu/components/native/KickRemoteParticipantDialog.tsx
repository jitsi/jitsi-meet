import React from 'react';
import { connect } from 'react-redux';

import ConfirmDialog from '../../../base/dialog/components/native/ConfirmDialog';
import { translate } from '../../../base/i18n/functions';
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
}

export default translate(connect()(KickRemoteParticipantDialog));
