// @flow

import React, { Component } from 'react';

import { DialogContent } from '../../../base/dialog';
import { translate } from '../../../base/i18n';

type Props = {

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * React Component for getting confirmation to start a file recording session.
 *
 * @extends Component
 */
class StartRecordingDialogContent extends Component<Props> {
    /**
     * Renders the platform specific dialog content.
     *
     * @returns {void}
     */
    render() {
        const { t } = this.props;

        return (
            <DialogContent>
                { t('recording.startRecordingBody') }
            </DialogContent>
        );
    }
}

export default translate(StartRecordingDialogContent);
