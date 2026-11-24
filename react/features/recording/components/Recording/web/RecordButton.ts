import { connect } from 'react-redux';

import { IReduxState } from '../../../../app/types';
import { openDialog } from '../../../../base/dialog/actions';
import { translate } from '../../../../base/i18n/functions';
import { isRecordingRunning } from '../../../functions';
import AbstractRecordButton, {
    IProps,
    _mapStateToProps as _abstractMapStateToProps
} from '../AbstractRecordButton';

import RecordingTranscriptionDialog from './RecordingTranscriptionDialog';


/**
 * Button for opening the unified recording & transcription management dialog.
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
        const { dispatch } = this.props;

        dispatch(openDialog('RecordingTranscriptionDialog', RecordingTranscriptionDialog));
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
        _isRecordingRunning: isRecordingRunning(state),
        visible
    };
}

export default translate(connect(_mapStateToProps)(RecordingButton));
