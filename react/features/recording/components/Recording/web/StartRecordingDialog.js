// @flow

import React from 'react';

import { Dialog } from '../../../../base/dialog';
import { translate } from '../../../../base/i18n';
import { connect } from '../../../../base/redux';
import { toggleScreenshotCaptureSummary } from '../../../../screenshot-capture';
import { isScreenshotCaptureEnabled } from '../../../../screenshot-capture/functions';
import { RECORDING_TYPES } from '../../../constants';
import AbstractStartRecordingDialog, {
    mapStateToProps as abstractMapStateToProps
} from '../AbstractStartRecordingDialog';
import StartRecordingDialogContent from '../StartRecordingDialogContent';

/**
 * React Component for getting confirmation to start a file recording session in
 * progress.
 *
 * @augments Component
 */
class StartRecordingDialog extends AbstractStartRecordingDialog {

    isStartRecordingDisabled: () => boolean;

    /**
     * Disables start recording button.
     *
     * @returns {boolean}
     */
    isStartRecordingDisabled() {
        const { isTokenValid, selectedRecordingService } = this.state;

        // Start button is disabled if recording service is only shown;
        // When validating dropbox token, if that is not enabled, we either always
        // show the start button or, if just dropbox is enabled, start button
        // is available when there is token.
        if (selectedRecordingService === RECORDING_TYPES.JITSI_REC_SERVICE) {
            return false;
        } else if (selectedRecordingService === RECORDING_TYPES.DROPBOX) {
            return !isTokenValid;
        }

        return true;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const {
            isTokenValid,
            isValidating,
            selectedRecordingService,
            sharingEnabled,
            spaceLeft,
            userName
        } = this.state;
        const {
            _fileRecordingsServiceEnabled,
            _fileRecordingsServiceSharingEnabled
        } = this.props;

        return (
            <Dialog
                okDisabled = { this.isStartRecordingDisabled() }
                okKey = 'dialog.startRecording'
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.startRecording'
                width = 'small'>
                <StartRecordingDialogContent
                    fileRecordingsServiceEnabled = { _fileRecordingsServiceEnabled }
                    fileRecordingsServiceSharingEnabled = { _fileRecordingsServiceSharingEnabled }
                    integrationsEnabled = { this._areIntegrationsEnabled() }
                    isTokenValid = { isTokenValid }
                    isValidating = { isValidating }
                    onChange = { this._onSelectedRecordingServiceChanged }
                    onSharingSettingChanged = { this._onSharingSettingChanged }
                    selectedRecordingService = { selectedRecordingService }
                    sharingSetting = { sharingEnabled }
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
    _toggleScreenshotCapture() {
        const { dispatch, _screenshotCaptureEnabled } = this.props;

        if (_screenshotCaptureEnabled) {
            dispatch(toggleScreenshotCaptureSummary(true));
        }
    }

    _areIntegrationsEnabled: () => boolean;
    _onSubmit: () => boolean;
    _onSelectedRecordingServiceChanged: (string) => void;
    _onSharingSettingChanged: () => void;
}

/**
 * Maps redux state to component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(state) {
    return {
        ...abstractMapStateToProps(state),
        _screenshotCaptureEnabled: isScreenshotCaptureEnabled(state, true, false)
    };
}

export default translate(connect(mapStateToProps)(StartRecordingDialog));
