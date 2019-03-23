// @flow

import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../../base/i18n';
import { CustomSubmitDialog } from '../../../../base/dialog';

import AbstractStartRecordingDialog, {
    mapStateToProps
} from '../AbstractStartRecordingDialog';
import StartRecordingDialogContent from '../StartRecordingDialogContent';

/**
 * React Component for getting confirmation to start a file recording session in
 * progress.
 *
 * @extends Component
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
            spaceLeft,
            userName
        } = this.state;
        const { _fileRecordingsServiceEnabled, _isDropboxEnabled } = this.props;

        // disable ok button id recording service is shown only, when
        // validating dropbox token, if that is not enabled we either always
        // show the ok button or if just dropbox is enabled ok is available
        // when there is token
        const isOkDisabled
            = _fileRecordingsServiceEnabled ? isValidating
                : _isDropboxEnabled ? !isTokenValid : false;

        return (
            <CustomSubmitDialog
                okDisabled = { isOkDisabled }
                onSubmit = { this._onSubmit } >
                <StartRecordingDialogContent
                    fileRecordingsServiceEnabled
                        = { _fileRecordingsServiceEnabled }
                    integrationsEnabled = { this._areIntegrationsEnabled() }
                    isTokenValid = { isTokenValid }
                    isValidating = { isValidating }
                    onChange = { this._onSelectedRecordingServiceChanged }
                    selectedRecordingService = { selectedRecordingService }
                    spaceLeft = { spaceLeft }
                    userName = { userName } />
            </CustomSubmitDialog>
        );
    }

    _areIntegrationsEnabled: () => boolean;
    _onSubmit: () => boolean
    _onSelectedRecordingServiceChanged: (string) => void;
}

export default translate(connect(mapStateToProps)(StartRecordingDialog));
