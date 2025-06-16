import React from 'react';
import { connect } from 'react-redux';

import ConfirmDialog from '../../../base/dialog/components/native/ConfirmDialog';
import { translate } from '../../../base/i18n/functions';
import AbstractGrantModeratorDialog, { abstractMapStateToProps }
    from '../AbstractGrantModeratorDialog';

/**
 * Dialog to confirm a remote participant kick action.
 */
class GrantModeratorDialog extends AbstractGrantModeratorDialog {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <ConfirmDialog
                descriptionKey = {
                    `${this.props.t('dialog.grantModeratorDialog',
                        { participantName: this.props.participantName })}`
                }
                onSubmit = { this._onSubmit } />
        );
    }
}

export default translate(connect(abstractMapStateToProps)(GrantModeratorDialog));
