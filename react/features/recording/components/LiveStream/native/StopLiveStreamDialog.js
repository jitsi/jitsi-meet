// @flow

import React from 'react';

import { ConfirmDialog } from '../../../../base/dialog';
import { translate } from '../../../../base/i18n';
import { connect } from '../../../../base/redux';
import AbstractStopLiveStreamDialog, {
    _mapStateToProps
} from '../AbstractStopLiveStreamDialog';

/**
 * A React Component for confirming the participant wishes to stop the currently
 * active live stream of the conference.
 *
 * @augments Component
 */
class StopLiveStreamDialog extends AbstractStopLiveStreamDialog {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <ConfirmDialog
                descriptionKey = 'dialog.stopStreamingWarning'
                onSubmit = { this._onSubmit } />
        );
    }

    _onSubmit: () => boolean;
}

export default translate(connect(_mapStateToProps)(StopLiveStreamDialog));
