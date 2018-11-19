// @flow

import { connect } from 'react-redux';

import { translate } from '../../../../base/i18n';

import AbstractStopLiveStreamDialog, {
    _mapStateToProps
} from '../AbstractStopLiveStreamDialog';

/**
 * A React Component for confirming the participant wishes to stop the currently
 * active live stream of the conference.
 *
 * @extends Component
 */
class StopLiveStreamDialog extends AbstractStopLiveStreamDialog {

    /**
     * Renders the platform specific {@code Dialog} content.
     *
     * @inheritdoc
     */
    _renderDialogContent() {
        return this.props.t('dialog.stopStreamingWarning');
    }
}

export default translate(connect(_mapStateToProps)(StopLiveStreamDialog));
