import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import Dialog from '../../../base/ui/components/web/Dialog';
import AbstractMuteRemoteParticipantsDesktopDialog, {
    abstractMapStateToProps
} from '../AbstractMuteRemoteParticipantsDesktopDialog';

/**
 * A React Component with the contents for a dialog that asks for confirmation
 * from the user before disabling a remote participants camera.
 *
 * @augments Component
 */
class MuteRemoteParticipantsDesktopDialog extends AbstractMuteRemoteParticipantsDesktopDialog {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        return (
            <Dialog
                ok = {{ translationKey: 'dialog.muteParticipantsDesktopButton' }}
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.muteParticipantsDesktopTitle'>
                <div>
                    {this.props.t(this.props.isModerationOn
                        ? 'dialog.muteParticipantsDesktopBodyModerationOn'
                        : 'dialog.muteParticipantsDesktopBody'
                    ) }
                </div>
            </Dialog>
        );
    }
}

export default translate(connect(abstractMapStateToProps)(MuteRemoteParticipantsDesktopDialog));
