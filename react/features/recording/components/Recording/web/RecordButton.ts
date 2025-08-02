import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../../app/types';
import { openDialog } from '../../../../base/dialog/actions';
import { translate } from '../../../../base/i18n/functions';
import { startLocalVideoRecording } from '../../../actions.any';
import AbstractRecordButton, {
    IProps as AbstractProps,
    _mapStateToProps as _abstractMapStateToProps
} from '../AbstractRecordButton';

import StopRecordingDialog from './StopRecordingDialog';

/**
 * The type of the React {@code Component} props of {@link RecordingButton}.
 */
interface IProps extends AbstractProps {

    /**
     * Redux dispatch function.
     */
    dispatch: IStore['dispatch'];
}


/**
 * Button for opening a dialog where a recording session can be started.
 */
class RecordingButton extends AbstractRecordButton<IProps> {

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    override _onHandleClick() {
        const { _isRecordingRunning, dispatch } = this.props;

        if (_isRecordingRunning) {
            // If recording is running, show stop dialog
            dispatch(openDialog(StopRecordingDialog));
        } else {
            // Start recording directly without dialog
            this._startRecording();
        }
    }

    /**
     * Starts recording directly with default settings.
     *
     * @private
     * @returns {void}
     */
    _startRecording() {
        const { dispatch } = this.props;

        // Use local video recording as a simpler alternative
        // This avoids complex conference state management
        dispatch(startLocalVideoRecording(false));
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code RecordButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _fileRecordingsDisabledTooltipKey: ?string,
 *     _isRecordingRunning: boolean,
 *     _disabled: boolean,
 *     visible: boolean
 * }}
 */
export function _mapStateToProps(state: IReduxState) {
    const abstractProps = _abstractMapStateToProps(state);
    const { toolbarButtons } = state['features/toolbox'];
    const visible = Boolean(toolbarButtons?.includes('recording') && abstractProps.visible);

    return {
        ...abstractProps,
        visible
    };
}

export default translate(connect(_mapStateToProps)(RecordingButton));
