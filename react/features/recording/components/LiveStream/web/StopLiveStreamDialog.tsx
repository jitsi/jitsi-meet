import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../../base/i18n/functions';
import Dialog from '../../../../base/ui/components/web/Dialog';
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
            <Dialog
                ok = {{ translationKey: 'dialog.stopLiveStreaming' }}
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.liveStreaming'>
                { this.props.t('dialog.stopStreamingWarning') }
            </Dialog>
        );
    }
}

export default translate(connect(_mapStateToProps)(StopLiveStreamDialog));
