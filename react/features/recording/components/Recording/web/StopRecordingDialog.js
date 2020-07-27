// @flow

import React from 'react';

import { Dialog } from '../../../../base/dialog';
import { translate } from '../../../../base/i18n';
import { JitsiRecordingConstants } from '../../../../base/lib-jitsi-meet';
import { connect } from '../../../../base/redux';
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
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _fileRecordingSession = {}, t } = this.props;

        const isInQueue = _fileRecordingSession.status === JitsiRecordingConstants.status.WAITING_IN_QUEUE;

        return (
            <Dialog
                okKey = { isInQueue ? 'dialog.leaveJibriQueue' : 'dialog.confirm' }
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.recording'
                width = 'small'>
                { t(isInQueue ? 'dialog.leaveJibriQueueWarning' : 'dialog.stopRecordingWarning') }
            </Dialog>
        );
    }

    _onSubmit: () => boolean
}

export default translate(connect(_mapStateToProps)(StopRecordingDialog));
