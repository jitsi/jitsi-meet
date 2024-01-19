import React from 'react';
import { connect } from 'react-redux';

import ConfirmDialog from '../../../base/dialog/components/native/ConfirmDialog';
import { translate } from '../../../base/i18n/functions';
import AbstractMuteRemoteParticipantsVideoDialog, {
    abstractMapStateToProps
} from '../AbstractMuteRemoteParticipantsVideoDialog';

/**
 * Dialog to confirm a remote participant's video stop action.
 */
class MuteRemoteParticipantsVideoDialog extends AbstractMuteRemoteParticipantsVideoDialog {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <ConfirmDialog
                descriptionKey = { this.props.isVideoModerationOn
                    ? 'dialog.muteParticipantsVideoDialogModerationOn'
                    : 'dialog.muteParticipantsVideoDialog'
                }
                onSubmit = { this._onSubmit } />
        );
    }
}

export default translate(connect(abstractMapStateToProps)(MuteRemoteParticipantsVideoDialog));
