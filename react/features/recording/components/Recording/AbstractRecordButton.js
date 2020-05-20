// @flow

import {
    createToolbarEvent,
    sendAnalytics
} from '../../../analytics';
import { openDialog } from '../../../base/dialog';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import {
    getLocalParticipant,
    isLocalParticipantModerator
} from '../../../base/participants';
import {
    AbstractButton,
    type AbstractButtonProps
} from '../../../base/toolbox';
import { getActiveSession } from '../../functions';

import { StartRecordingDialog, StopRecordingDialog } from './_';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractRecordButton}.
 */
export type Props = AbstractButtonProps & {

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
 * An abstract implementation of a button for starting and stopping recording.
 */
export default class AbstractRecordButton<P: Props>
    extends AbstractButton<P, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.recording';
    label = 'dialog.startRecording';
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

        sendAnalytics(createToolbarEvent(
            'recording.button',
            {
                'is_recording': _isRecordingRunning,
                type: JitsiRecordingConstants.mode.FILE
            }));

        dispatch(openDialog(
            _isRecordingRunning ? StopRecordingDialog : StartRecordingDialog
        ));
    }

    /**
     * Helper function to be implemented by subclasses, which must return a
     * boolean value indicating if this button is disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return false;
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
 * @param {Props} ownProps - The own props of the Component.
 * @private
 * @returns {{
 *     _isRecordingRunning: boolean,
 *     disabledByFeatures: boolean,
 *     visible: boolean
 * }}
 */
export function _mapStateToProps(state: Object, ownProps: Props): Object {
    let { visible } = ownProps;

    // a button can be disabled/enabled only if enableFeaturesBasedOnToken
    // is on
    let disabledByFeatures;

    if (typeof visible === 'undefined') {
        // If the containing component provides the visible prop, that is one
        // above all, but if not, the button should be autonomus and decide on
        // its own to be visible or not.
        const isModerator = isLocalParticipantModerator(state);
        const {
            enableFeaturesBasedOnToken,
            fileRecordingsEnabled
        } = state['features/base/config'];
        const { features = {} } = getLocalParticipant(state);

        visible = isModerator
            && fileRecordingsEnabled;

        if (enableFeaturesBasedOnToken) {
            visible = visible && String(features.recording) === 'true';
            disabledByFeatures = String(features.recording) === 'disabled';
        }
    }

    return {
        _isRecordingRunning:
            Boolean(getActiveSession(state, JitsiRecordingConstants.mode.FILE)),
        disabledByFeatures,
        visible
    };
}
