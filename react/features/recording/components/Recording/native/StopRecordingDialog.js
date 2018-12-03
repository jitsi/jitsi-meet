// @flow

import React from 'react';
import { connect } from 'react-redux';

import { DialogContent } from '../../../../base/dialog';
import { translate } from '../../../../base/i18n';

import AbstractStopRecordingDialog, {
    type Props,
    _mapStateToProps
} from '../AbstractStopRecordingDialog';

/**
 * React Component for getting confirmation to stop a file recording session in
 * progress.
 *
 * @extends Component
 */
class StopRecordingDialog extends AbstractStopRecordingDialog<Props> {

    /**
     * Renders the platform specific dialog content.
     *
     * @inheritdoc
     */
    _renderDialogContent() {
        const { t } = this.props;

        return (
            <DialogContent>
                { t('dialog.stopRecordingWarning') }
            </DialogContent>
        );
    }
}

export default translate(connect(_mapStateToProps)(StopRecordingDialog));
