import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../../base/i18n/functions';
import Dialog from '../../../../base/ui/components/web/Dialog';
import { toggleScreenshotCaptureSummary } from '../../../../screenshot-capture/actions';
import AbstractStopRecordingDialog, {
    IProps,
    _mapStateToProps
} from '../AbstractStopRecordingDialog';

/**
 * React Component for getting confirmation to stop a file recording session in
 * progress.
 *
 * @augments Component
 */
class StopRecordingDialog extends AbstractStopRecordingDialog<IProps> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        const { localRecordingVideoStop, stopMode, t } = this.props;

        const titleKey = stopMode === 'transcription' ? 'dialog.stopTranscription' : 'dialog.recording';
        const bodyKey = stopMode === 'transcription'
            ? 'dialog.stopTranscriptionWarning'
            : (localRecordingVideoStop ? 'recording.localRecordingVideoStop' : 'dialog.stopRecordingWarning');

        return (
            <Dialog
                ok = {{ translationKey: 'dialog.confirm' }}
                onSubmit = { this._onSubmit }
                titleKey = { titleKey }>
                { t(bodyKey) }
            </Dialog>
        );
    }

    /**
     * Toggles screenshot capture.
     *
     * @returns {void}
     */
    override _toggleScreenshotCapture() {
        this.props.dispatch(toggleScreenshotCaptureSummary(false));
    }
}

export default translate(connect(_mapStateToProps)(StopRecordingDialog));
