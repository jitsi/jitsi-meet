import React from 'react';
import { connect } from 'react-redux';

import ConfirmDialog from '../../../base/dialog/components/native/ConfirmDialog';
import { translate } from '../../../base/i18n/functions';
import AbstractDemoteToVisitorDialog from '../AbstractDemoteToVisitorDialog';

/**
 * Dialog to confirm a remote participant demote to visitor action.
 */
class DemoteToVisitorDialog extends AbstractDemoteToVisitorDialog {
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
                confirmLabel = 'dialog.confirm'
                descriptionKey = 'dialog.demoteParticipantDialog'
                isConfirmDestructive = { true }
                onSubmit = { this._onSubmit }
                title = 'dialog.demoteParticipantTitle' />
        );
    }
}

export default translate(connect()(DemoteToVisitorDialog));
