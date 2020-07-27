// @flow

import React from 'react';

import { Dialog } from '../../../../base/dialog';
import { translate } from '../../../../base/i18n';
import { JitsiRecordingConstants } from '../../../../base/lib-jitsi-meet';
import { connect } from '../../../../base/redux';
import AbstractStopLiveStreamDialog, {
    _mapStateToProps
} from '../AbstractStopLiveStreamDialog';

/**
 * A React Component for confirming the participant wishes to stop the currently
 * active live stream of the conference.
 *
 * @extends Component
 */
class StopLiveStreamDialog extends AbstractStopLiveStreamDialog {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _session = {}, t } = this.props;

        const isInQueue = _session.status === JitsiRecordingConstants.status.WAITING_IN_QUEUE;

        return (
            <Dialog
                okKey = { isInQueue ? 'dialog.leaveJibriQueue' : 'dialog.stopLiveStreaming' }
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.liveStreaming'
                width = 'small'>
                { t(isInQueue ? 'dialog.leaveJibriQueueWarning' : 'dialog.stopStreamingWarning') }
            </Dialog>
        );
    }

    _onSubmit: () => boolean;
}

export default translate(connect(_mapStateToProps)(StopLiveStreamDialog));
