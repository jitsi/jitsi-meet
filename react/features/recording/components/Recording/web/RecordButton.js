// @flow

import { getToolbarButtons } from '../../../../base/config';
import { openDialog } from '../../../../base/dialog';
import { translate } from '../../../../base/i18n';
import { connect } from '../../../../base/redux';
import AbstractRecordButton, {
    type Props,
    _mapStateToProps as _abstractMapStateToProps
} from '../AbstractRecordButton';

import { StartRecordingDialog, StopRecordingDialog } from './index';

//Gractech
import { startLocalVideoRecording } from '../../../actions';


//Gracetech
import { isMobileBrowser } from '../../../../base/environment/utils';

/**
 * Button for opening a dialog where a recording session can be started.
 */
class RecordingButton extends AbstractRecordButton<Props> {

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _onHandleClick() {
        //Gracetech -- we don't support recording on mobile devices
        if (isMobileBrowser()) {
            alert("Recording feature is only available on desktop through https://idigest.app");
            return;
        } 
        const { _isRecordingRunning, dispatch } = this.props;

        /*original code
        dispatch(openDialog(
            _isRecordingRunning ? StopRecordingDialog : StartRecordingDialog
        ));
        */

        //Gracetech: we skip the startRecordingDialog
        dispatch(_isRecordingRunning? openDialog(StopRecordingDialog) : startLocalVideoRecording(false));
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code RecordButton} component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the Component.
 * @private
 * @returns {{
 *     _fileRecordingsDisabledTooltipKey: ?string,
 *     _isRecordingRunning: boolean,
 *     _disabled: boolean,
 *     visible: boolean
 * }}
 */
export function _mapStateToProps(state: Object, ownProps: Props): Object {
    const abstractProps = _abstractMapStateToProps(state, ownProps);
    const toolbarButtons = getToolbarButtons(state);
    const visible = toolbarButtons.includes('recording') && abstractProps.visible;

    return {
        ...abstractProps,
        visible
    };
}

export default translate(connect(_mapStateToProps)(RecordingButton));
