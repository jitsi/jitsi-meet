import React from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../../app/types';
import { translate } from '../../../../base/i18n/functions';
import Dialog from '../../../../base/ui/components/web/Dialog';
import { toggleScreenshotCaptureSummary } from '../../../../screenshot-capture/actions';
import { isScreenshotCaptureEnabled } from '../../../../screenshot-capture/functions';
import { RECORDING_TYPES } from '../../../constants';
import AbstractStartRecordingDialog, {
    mapStateToProps as abstractMapStateToProps
} from '../AbstractStartRecordingDialog';

import StartRecordingDialogContent from './StartRecordingDialogContent';


/**
 * React Component for getting confirmation to start a file recording session in
 * progress.
 *
 * @augments Component
 */
class RecordingTranscriptionDialog extends AbstractStartRecordingDialog {

    /**
     * Returns true when the primary button should be disabled.
     *
     * Disabled when nothing has changed (no-op), or when starting recording
     * but the recording service selection is invalid.
     *
     * @returns {boolean}
     */
    isStartRecordingDisabled() {
        if (!this._isChanged()) {
            return true;
        }

        const { _recordingRunning } = this.props;
        const { isTokenValid, selectedRecordingService, shouldRecordAudioAndVideo } = this.state;
        const startingRecording = !_recordingRunning && shouldRecordAudioAndVideo;

        if (!startingRecording) {
            return false;
        }

        if (selectedRecordingService === RECORDING_TYPES.JITSI_REC_SERVICE) {
            return false;
        } else if (selectedRecordingService === RECORDING_TYPES.DROPBOX) {
            return !isTokenValid;
        } else if (selectedRecordingService === RECORDING_TYPES.LOCAL) {
            return false;
        }

        return true;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    override render() {
        const {
            isTokenValid,
            isValidating,
            localRecordingOnlySelf,
            selectedRecordingService,
            sharingEnabled,
            shouldRecordAudioAndVideo,
            shouldRecordTranscription,
            spaceLeft,
            userName
        } = this.state;
        const {
            _fileRecordingsServiceEnabled,
            _fileRecordingsServiceSharingEnabled,
            _recordingRunning,
            _transcriptionRunning
        } = this.props;

        return (
            <Dialog
                ok = {{
                    translationKey: 'dialog.applyChanges',
                    disabled: this.isStartRecordingDisabled()
                }}
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.recordAndTranscribe'>
                <StartRecordingDialogContent
                    fileRecordingsServiceEnabled = { _fileRecordingsServiceEnabled }
                    fileRecordingsServiceSharingEnabled = { _fileRecordingsServiceSharingEnabled }
                    integrationsEnabled = { this._areIntegrationsEnabled() }
                    isTokenValid = { isTokenValid }
                    isValidating = { isValidating }
                    localRecordingOnlySelf = { localRecordingOnlySelf }
                    onChange = { this._onSelectedRecordingServiceChanged }
                    onLocalRecordingSelfChange = { this._onLocalRecordingSelfChange }
                    onRecordAudioAndVideoChange = { this._onRecordAudioAndVideoChange }
                    onSharingSettingChanged = { this._onSharingSettingChanged }
                    onTranscriptionChange = { this._onTranscriptionChange }
                    recordingRunning = { Boolean(_recordingRunning) }
                    selectedRecordingService = { selectedRecordingService }
                    sessionActive = { Boolean(_recordingRunning || _transcriptionRunning) }
                    sharingSetting = { sharingEnabled }
                    shouldRecordAudioAndVideo = { shouldRecordAudioAndVideo }
                    shouldRecordTranscription = { shouldRecordTranscription }
                    spaceLeft = { spaceLeft }
                    userName = { userName } />
            </Dialog>
        );
    }

    /**
     * Toggles screenshot capture feature.
     *
     * @returns {void}
     */
    override _toggleScreenshotCapture() {
        const { dispatch, _screenshotCaptureEnabled } = this.props;

        if (_screenshotCaptureEnabled) {
            dispatch(toggleScreenshotCaptureSummary(true));
        }
    }
}

/**
 * Maps redux state to component props.
 *
 * @param {Object} state - Redux state.
 * @param {any} ownProps - Component's own props.
 * @returns {Object}
 */
function mapStateToProps(state: IReduxState, ownProps: any) {
    return {
        ...abstractMapStateToProps(state, ownProps),
        _screenshotCaptureEnabled: isScreenshotCaptureEnabled(state, true, false)
    };
}

export default translate(connect(mapStateToProps)(RecordingTranscriptionDialog));
