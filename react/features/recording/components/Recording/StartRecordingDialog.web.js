// @flow

import { connect } from 'react-redux';

import { translate } from '../../../base/i18n';

import AbstractStartRecordingDialog, {
    type Props,
    _mapStateToProps
} from './AbstractStartRecordingDialog';

/**
 * React Component for getting confirmation to start a file recording session.
 *
 * @extends Component
 */
class StartRecordingDialog extends AbstractStartRecordingDialog<Props> {
    /**
     * Renders the platform specific dialog content.
     *
     * @protected
     * @returns {React$Component}
     */
    _renderDialogContent() {
        const { t } = this.props;

        return (
            t('recording.startRecordingBody')
        );
    }
}

export default translate(connect(_mapStateToProps)(StartRecordingDialog));
