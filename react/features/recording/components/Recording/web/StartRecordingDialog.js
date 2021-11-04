// @flow

import React from 'react';

import { Dialog } from '../../../../base/dialog';
import { translate } from '../../../../base/i18n';
import { connect } from '../../../../base/redux';
import AbstractStartRecordingDialog, {
    mapStateToProps
} from '../AbstractStartRecordingDialog';
import StartRecordingDialogContent from '../StartRecordingDialogContent';

/**
 * React Component for getting confirmation to start a file recording session in
 * progress.
 *
 * @augments Component
 */
class StartRecordingDialog extends AbstractStartRecordingDialog {
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
        const { _fileRecordingsServiceEnabled, _fileRecordingsServiceSharingEnabled, _isDropboxEnabled } = this.props;

        // disable ok button id recording service is shown only, when
        // validating dropbox token, if that is not enabled we either always
        // show the ok button or if just dropbox is enabled ok is available
        // when there is token
        const isOkDisabled
            = _fileRecordingsServiceEnabled ? isValidating
                : _isDropboxEnabled ? !isTokenValid : false;

        return (
            <Dialog
                okDisabled = { isOkDisabled }
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

    _areIntegrationsEnabled: () => boolean;
    _onSubmit: () => boolean;
    _onSelectedRecordingServiceChanged: (string) => void;
    _onSharingSettingChanged: () => void;
}

export default translate(connect(mapStateToProps)(StartRecordingDialog));
