// @flow

import { connect } from 'react-redux';

import { translate } from '../../../base/i18n';

import AbstractStopRecordingDialog, {
    type Props,
    _mapStateToProps
} from './AbstractStopRecordingDialog';

/**
 * React Component for getting confirmation to stop a file recording session in
 * progress.
 *
 * @extends Component
 */
class StopRecordingDialog extends AbstractStopRecordingDialog<Props> {

    /**
     * Renders the platform specific dialog content.
     *
     * @protected
     * @returns {React$Component}
     */
    _renderDialogContent() {
        const { t } = this.props;

        return (
            t('dialog.stopRecordingWarning')
        );
    }
}

export default translate(connect(_mapStateToProps)(StopRecordingDialog));
