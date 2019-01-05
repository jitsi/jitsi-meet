// @flow

import React from 'react';
import { connect } from 'react-redux';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';

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
            <Dialog
                okTitleKey = 'dialog.kickParticipantButton'
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.kickParticipantTitle'
                width = 'small'>
                <div>
                    { this.props.t('dialog.kickParticipantDialog') }
                </div>
            </Dialog>
        );
    }

    _onSubmit: () => boolean;
}

export default translate(connect()(KickRemoteParticipantDialog));
