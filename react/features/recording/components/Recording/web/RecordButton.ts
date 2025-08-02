import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../../app/types';
import { IJitsiConference } from '../../../../base/conference/reducer';
import { openDialog } from '../../../../base/dialog/actions';
import { translate } from '../../../../base/i18n/functions';
import { JitsiRecordingConstants } from '../../../../base/lib-jitsi-meet';
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
     * The {@code JitsiConference} for the current conference.
     */
    _conference?: IJitsiConference;

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
     * Starts recording directly with default settings using Jibri.
     *
     * @private
     * @returns {void}
     */
    _startRecording() {
        const { _conference } = this.props;

        if (_conference) {
            // Start Jibri recording with file recording metadata
            const appData = JSON.stringify({
                'file_recording_metadata': {
                    'share': false // You can set this to true if you want sharing enabled by default
                }
            });

            _conference.startRecording({
                mode: JitsiRecordingConstants.mode.FILE,
                appData
            });
        }
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code RecordButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _conference: IJitsiConference,
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
        _conference: state['features/base/conference'].conference,
        visible
    };
}

export default translate(connect(_mapStateToProps)(RecordingButton));
