// @flow

import React from 'react';

import { Dialog } from '../../../../base/dialog';
import { translate } from '../../../../base/i18n';
import { connect } from '../../../../base/redux';
import { toggleScreenshotCaptureSummary } from '../../../../screenshot-capture';
import { isScreenshotCaptureEnabled } from '../../../../screenshot-capture/functions';
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

    _onDisableStartRecording: () => boolean;

    /**
     * Disables start recording button.
     *
     * @returns {boolean}
     */
    _onDisableStartRecording() {
        const { _fileRecordingsServiceEnabled, _isDropboxEnabled } = this.props;
        const { isTokenValid, isValidating } = this.state;

        // disable ok button id recording service is shown only, when
        // validating dropbox token, if that is not enabled we either always
        // show the ok button or if just dropbox is enabled ok is available
        // when there is token
        if (_fileRecordingsServiceEnabled) {
            return isValidating;
        } else if (_isDropboxEnabled) {
            return !isTokenValid;
        }

        return false;
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
                okDisabled = { this._onDisableStartRecording() }
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
