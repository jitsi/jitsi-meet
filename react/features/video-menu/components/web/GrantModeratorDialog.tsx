import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import Dialog from '../../../base/ui/components/web/Dialog';
import AbstractGrantModeratorDialog, { abstractMapStateToProps } from '../AbstractGrantModeratorDialog';

/**
 * Dialog to confirm a grant moderator action.
 */
class GrantModeratorDialog extends AbstractGrantModeratorDialog {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        return (
            <Dialog
                ok = {{ translationKey: 'dialog.Yes' }}
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.grantModeratorTitle'>
                <div>
                    { this.props.t('dialog.grantModeratorDialog', { participantName: this.props.participantName }) }
                </div>
            </Dialog>
        );
    }
}

export default translate(connect(abstractMapStateToProps)(GrantModeratorDialog));
