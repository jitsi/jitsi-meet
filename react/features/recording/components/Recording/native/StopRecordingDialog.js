// @flow

import React from 'react';

import { ConfirmDialog } from '../../../../base/dialog';
import { translate } from '../../../../base/i18n';
import { connect } from '../../../../base/redux';
import AbstractStopRecordingDialog, {
    type Props,
    _mapStateToProps
} from '../AbstractStopRecordingDialog';

/**
 * React Component for getting confirmation to stop a file recording session in
 * progress.
 *
 * @augments Component
 */
class StopRecordingDialog extends AbstractStopRecordingDialog<Props> {

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <ConfirmDialog
                descriptionKey = 'dialog.stopRecordingWarning'
                onSubmit = { this._onSubmit } />
        );
    }

    _onSubmit: () => boolean;
}

export default translate(connect(_mapStateToProps)(StopRecordingDialog));
