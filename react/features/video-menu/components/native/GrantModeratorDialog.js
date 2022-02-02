// @flow

import React from 'react';
import { Text } from 'react-native';

import { ConfirmDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
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
                contentKey = 'dialog.grantModeratorDialog'
                onSubmit = { this._onSubmit }>
                <Text>
                    {`${this.props.t('dialog.grantModeratorDialog', { participantName: this.props.participantName })}`}
                </Text>
            </ConfirmDialog>
        );
    }

    _onSubmit: () => boolean;
}

export default translate(connect(abstractMapStateToProps)(GrantModeratorDialog));
