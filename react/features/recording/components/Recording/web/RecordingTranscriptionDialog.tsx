import React from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../../app/types';
import { hideDialog } from '../../../../base/dialog/actions';
import { translate } from '../../../../base/i18n/functions';
import Dialog from '../../../../base/ui/components/web/Dialog';
import { toggleScreenshotCaptureSummary } from '../../../../screenshot-capture/actions';
import { isScreenshotCaptureEnabled } from '../../../../screenshot-capture/functions';
import AbstractStartRecordingDialog, {
    mapStateToProps as abstractMapStateToProps
} from '../AbstractStartRecordingDialog';

import StartRecordingDialogContent from './StartRecordingDialogContent';


/**
 * React Component for the recording & transcription dialog. Each section
 * (audio & video recording, transcription) has its own start/stop button
 * which applies the action immediately and closes the dialog.
 *
 * @augments Component
 */
class RecordingTranscriptionDialog extends AbstractStartRecordingDialog {

    /**
     * Dismisses the dialog.
     *
     * @inheritdoc
     * @returns {void}
     */
    override _dismiss() {
        this.props.dispatch(hideDialog());
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
            selectedLanguage,
            selectedRecordingService,
            sharingEnabled,
            spaceLeft,
            userName
        } = this.state;
        const {
            _canTranscribe,
            _fileRecordingsServiceEnabled,
            _fileRecordingsServiceSharingEnabled,
            _recordingRunning,
            _transcriptionRunning,
            recordAudioAndVideo
        } = this.props;

        return (
            <Dialog
                cancel = {{ hidden: true }}
                disableEnter = { true }
                ok = {{ hidden: true }}
                titleKey = { _canTranscribe ? 'dialog.recordAndTranscribe' : 'toolbar.record' }>
                <StartRecordingDialogContent
                    fileRecordingsServiceEnabled = { _fileRecordingsServiceEnabled }
                    fileRecordingsServiceSharingEnabled = { _fileRecordingsServiceSharingEnabled }
                    integrationsEnabled = { this._areIntegrationsEnabled() }
                    isTokenValid = { isTokenValid }
                    isValidating = { isValidating }
                    localRecordingOnlySelf = { localRecordingOnlySelf }
                    onLocalRecordingSelfChange = { this._onLocalRecordingSelfChange }
                    onRecordingServiceChange = { this._onSelectedRecordingServiceChanged }
                    onSharingSettingChanged = { this._onSharingSettingChanged }
                    onStartBoth = { this._onStartBothPress }
                    onStartRecording = { this._onStartRecordingPress }
                    onStartTranscription = { this._onStartTranscriptionPress }
                    onStopBoth = { this._onStopBothPress }
                    onStopRecording = { this._onStopRecordingPress }
                    onStopTranscription = { this._onStopTranscriptionPress }
                    onSubtitlesLanguageChange = { this._onSubtitlesLanguageChanged }
                    recordAudioAndVideo = { recordAudioAndVideo }
                    recordingRunning = { Boolean(_recordingRunning) }
                    selectedLanguage = { selectedLanguage }
                    selectedRecordingService = { selectedRecordingService }
                    sharingSetting = { sharingEnabled }
                    spaceLeft = { spaceLeft }
                    startRecordingDisabled = { this._isStartRecordingDisabled() }
                    transcriptionRunning = { Boolean(_transcriptionRunning) }
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
