// @flow

import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../../base/i18n';
import { Dialog } from '../../../../base/dialog';

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

        return (
            <Dialog
                okDisabled = { !isTokenValid && _isDropboxEnabled }
                okKey = 'dialog.confirm'
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.recording'
                width = 'small'>
                <StartRecordingDialogContent
                    integrationsEnabled = { _isDropboxEnabled }
                    isTokenValid = { isTokenValid }
                    isValidating = { isValidating }
                    spaceLeft = { spaceLeft }
                    userName = { userName } />
            </Dialog>
        );
    }

    _onSubmit: () => boolean
}

export default translate(connect(mapStateToProps)(StartRecordingDialog));
