// @flow

import React from 'react';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import AbstractTipRemoteParticipantDialog
    from '../AbstractTipRemoteParticipantDialog';

/**
 * Dialog to confirm a remote participant tip action.
 */
class TipRemoteParticipantDialog extends AbstractTipRemoteParticipantDialog {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Dialog
                okKey = 'dialog.tipParticipantButton'
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.tipParticipantTitle'
                width = 'small'>
                <div>
                    Tip component here
                </div>
            </Dialog>
        );
    }

    _onSubmit: () => boolean;
}

export default translate(connect()(TipRemoteParticipantDialog));
