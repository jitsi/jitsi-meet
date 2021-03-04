/* @flow */

import React from 'react';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import AbstractMuteRemoteParticipantsVideoDialog
    from '../AbstractMuteRemoteParticipantsVideoDialog';

/**
 * A React Component with the contents for a dialog that asks for confirmation
 * from the user before disabling a remote participants camera.
 *
 * @extends Component
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
                okKey = 'dialog.muteParticipantsVideoButton'
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.muteParticipantsVideoTitle'
                width = 'small'>
                <div>
                    { this.props.t('dialog.muteParticipantsVideoBody') }
                </div>
            </Dialog>
        );
    }

    _onSubmit: () => boolean;
}

export default translate(connect()(MuteRemoteParticipantsVideoDialog));
