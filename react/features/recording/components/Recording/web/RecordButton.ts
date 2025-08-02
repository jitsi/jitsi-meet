import { connect } from 'react-redux';

import { createRecordingDialogEvent } from '../../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../../analytics/functions';
import { IReduxState, IStore } from '../../../../app/types';
import { IJitsiConference } from '../../../../base/conference/reducer';
import { translate } from '../../../../base/i18n/functions';
import { JitsiRecordingConstants } from '../../../../base/lib-jitsi-meet';
import { setRequestingSubtitles } from '../../../../subtitles/actions.any';
import { toggleScreenshotCaptureSummary } from '../../../../screenshot-capture/actions';
import { RECORDING_METADATA_ID } from '../../../constants';
import { getActiveSession } from '../../../functions';
import AbstractRecordButton, {
    IProps as AbstractProps,
    _mapStateToProps as _abstractMapStateToProps
} from '../AbstractRecordButton';

/**
 * The type of the React {@code Component} props of {@link RecordingButton}.
 */
interface IProps extends AbstractProps {

    /**
     * The {@code JitsiConference} for the current conference.
     */
    _conference?: IJitsiConference;

    /**
     * Whether subtitles should be displayed or not.
     */
    _displaySubtitles?: boolean;

    /**
     * The redux representation of the recording session to be stopped.
     */
    _fileRecordingSession?: any;

    /**
     * The selected language for subtitles.
     */
    _subtitlesLanguage: string | null;

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
        const { _isRecordingRunning } = this.props;

        if (_isRecordingRunning) {
            // Stop recording directly without showing dialog
            this._stopRecording();
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

    /**
     * Stops the recording if it's currently running.
     *
     * @private
     * @returns {void}
     */
    _stopRecording() {
        const {
            _conference,
            _displaySubtitles,
            _fileRecordingSession,
            _subtitlesLanguage,
            dispatch
        } = this.props;

        sendAnalytics(createRecordingDialogEvent('stop', 'confirm.button'));

        // Only handle Jibri (file) recordings
        if (_fileRecordingSession) {
            _conference?.stopRecording(_fileRecordingSession.id);
            dispatch(toggleScreenshotCaptureSummary(false));
        }

        dispatch(setRequestingSubtitles(Boolean(_displaySubtitles), _displaySubtitles, _subtitlesLanguage));

        _conference?.getMetadataHandler().setMetadata(RECORDING_METADATA_ID, {
            isTranscribingEnabled: false
        });
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

    const {
        _displaySubtitles,
        _language: _subtitlesLanguage
    } = state['features/subtitles'];

    return {
        ...abstractProps,
        _conference: state['features/base/conference'].conference,
        _displaySubtitles,
        _fileRecordingSession: getActiveSession(state, JitsiRecordingConstants.mode.FILE),
        _subtitlesLanguage,
        visible
    };
}

export default translate(connect(_mapStateToProps)(RecordingButton));
