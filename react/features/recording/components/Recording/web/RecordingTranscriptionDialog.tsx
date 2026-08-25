import React from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../../app/types';
import { hideDialog } from '../../../../base/dialog/actions';
import { translate } from '../../../../base/i18n/functions';
import Dialog from '../../../../base/ui/components/web/Dialog';
import { toggleScreenshotCaptureSummary } from '../../../../screenshot-capture/actions';
import { isScreenshotCaptureEnabled } from '../../../../screenshot-capture/functions';
import AbstractStartRecordingDialog, {
    IProps,
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
     * Initializes a new {@code RecordingTranscriptionDialog} instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this._onStartRecordingPress = this._onStartRecordingPress.bind(this);
        this._onStopRecordingPress = this._onStopRecordingPress.bind(this);
        this._onStartTranscriptionPress = this._onStartTranscriptionPress.bind(this);
        this._onStopTranscriptionPress = this._onStopTranscriptionPress.bind(this);
        this._onStartBothPress = this._onStartBothPress.bind(this);
        this._onStopBothPress = this._onStopBothPress.bind(this);
    }

    /**
     * Closes the dialog.
     *
     * @returns {void}
     */
    _closeDialog() {
        this.props.dispatch(hideDialog());
    }

    /**
     * Starts the recording and closes the dialog.
     *
     * @returns {void}
     */
    _onStartRecordingPress() {
        this._onStartRecording() && this._closeDialog();
    }

    /**
     * Stops the recording and closes the dialog.
     *
     * @returns {void}
     */
    _onStopRecordingPress() {
        this._onStopRecording() && this._closeDialog();
    }

    /**
     * Starts the transcription and closes the dialog.
     *
     * @returns {void}
     */
    _onStartTranscriptionPress() {
        this._onStartTranscription() && this._closeDialog();
    }

    /**
     * Stops the transcription and closes the dialog.
     *
     * @returns {void}
     */
    _onStopTranscriptionPress() {
        this._onStopTranscription() && this._closeDialog();
    }

    /**
     * Starts the services which are not running and closes the dialog.
     *
     * @returns {void}
     */
    _onStartBothPress() {
        this._onStartBoth() && this._closeDialog();
    }

    /**
     * Stops the running services and closes the dialog.
     *
     * @returns {void}
     */
    _onStopBothPress() {
        this._onStopBoth() && this._closeDialog();
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
