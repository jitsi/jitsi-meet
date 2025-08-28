import React from 'react';
import { connect } from 'react-redux';

import ConfirmDialog from '../../../../base/dialog/components/native/ConfirmDialog';
import { translate } from '../../../../base/i18n/functions';
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
    override render() {
        return (
            <ConfirmDialog
                descriptionKey = 'dialog.stopStreamingWarning'
                onSubmit = { this._onSubmit } />
        );
    }
}

export default translate(connect(_mapStateToProps)(StopLiveStreamDialog));
