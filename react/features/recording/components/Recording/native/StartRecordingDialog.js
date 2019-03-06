// @flow

import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../../base/i18n';
import { ConfirmDialog, CustomSubmitDialog } from '../../../../base/dialog';

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
        const { isTokenValid, isValidating, spaceLeft, userName } = this.state;
        const { _isDropboxEnabled } = this.props;

        // Explicit true is needed, see StartRecordingDialogContent
        if (_isDropboxEnabled === true) {
            return (
                <CustomSubmitDialog
                    okDisabled = { _isDropboxEnabled && !isTokenValid }
                    onSubmit = { this._onSubmit } >
                    <StartRecordingDialogContent
                        integrationsEnabled = { _isDropboxEnabled }
                        isTokenValid = { isTokenValid }
                        isValidating = { isValidating }
                        spaceLeft = { spaceLeft }
                        userName = { userName } />
                </CustomSubmitDialog>
            );
        }

        return (
            <ConfirmDialog
                contentKey = 'recording.startRecordingBody'
                onSubmit = { this._onSubmit } />
        );
    }

    _onSubmit: () => boolean
}

export default translate(connect(mapStateToProps)(StartRecordingDialog));
