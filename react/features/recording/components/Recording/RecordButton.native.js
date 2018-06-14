// @flow

import { connect } from 'react-redux';

import { openDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import {
    isLocalParticipantModerator
} from '../../../base/participants';
import {
    AbstractButton,
    type AbstractButtonProps
} from '../../../base/toolbox';

import { getActiveSession } from '../../functions';

import StartRecordingDialog from './StartRecordingDialog';
import StopRecordingDialog from './StopRecordingDialog';

/**
 * The type of the React {@code Component} props of {@link RecordButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * The current conference object.
     */
    _conference: Object,

    /**
     * True if there is a running active recording, false otherwise.
     */
    _isRecordingRunning: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * The i18n translate function.
     */
    t: Function
};

/**
 * An implementation of a button for starting and stopping recording.
 */
class RecordButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'Recording';
    iconName = 'recEnable';
    label = 'dialog.startRecording';
    toggledIconName = 'recDisable';
    toggledLabel = 'dialog.stopRecording';

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { _isRecordingRunning, dispatch } = this.props;

        dispatch(openDialog(
            _isRecordingRunning ? StopRecordingDialog : StartRecordingDialog
        ));
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._isRecordingRunning;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code RecordButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _conference: Object,
 *     _isRecordingRunning: boolean,
 *     visible: boolean
 * }}
 */
function _mapStateToProps(state): Object {
    const isModerator = isLocalParticipantModerator(state);
    const { fileRecordingsEnabled } = state['features/base/config'];

    return {
        _conference: state['features/base/conference'].conference,
        _isRecordingRunning:
            Boolean(getActiveSession(state, JitsiRecordingConstants.mode.FILE)),
        visible: isModerator && fileRecordingsEnabled
    };
}

export default translate(connect(_mapStateToProps)(RecordButton));
