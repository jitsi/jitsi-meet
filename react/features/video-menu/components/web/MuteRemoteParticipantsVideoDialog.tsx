import React from 'react';

import { translate } from '../../../base/i18n/functions';
import { connect } from '../../../base/redux/functions';
import Dialog from '../../../base/ui/components/web/Dialog';
import AbstractMuteRemoteParticipantsVideoDialog, {
    abstractMapStateToProps
} from '../AbstractMuteRemoteParticipantsVideoDialog';

/**
 * A React Component with the contents for a dialog that asks for confirmation
 * from the user before disabling a remote participants camera.
 *
 * @augments Component
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
            <Dialog
                ok = {{ translationKey: 'dialog.muteParticipantsVideoButton' }}
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.muteParticipantsVideoTitle'>
                <div>
                    {this.props.t(this.props.isVideoModerationOn
                        ? 'dialog.muteParticipantsVideoBodyModerationOn'
                        : 'dialog.muteParticipantsVideoBody'
                    ) }
                </div>
            </Dialog>
        );
    }
}

// @ts-ignore
export default translate(connect(abstractMapStateToProps)(MuteRemoteParticipantsVideoDialog));
