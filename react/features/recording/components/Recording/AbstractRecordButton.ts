import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState } from '../../../app/types';
import { IconRecord, IconStop } from '../../../base/icons/svg';
import { MEET_FEATURES } from '../../../base/jwt/constants';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { maybeShowPremiumFeatureDialog } from '../../../jaas/actions';
import { getRecordButtonProps, isRecordingRunning } from '../../functions';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractRecordButton}.
 */
export interface IProps extends AbstractButtonProps {

    /**
     * True if the button needs to be disabled.
     */
    _disabled: boolean;

    /**
     * True if there is a running active recording, false otherwise.
     */
    _isRecordingRunning: boolean;

    /**
     * The tooltip to display when hovering over the button.
     */
    _tooltip?: string;
}

/**
 * An abstract implementation of a button for starting and stopping recording.
 */
export default class AbstractRecordButton<P extends IProps> extends AbstractButton<P> {
    accessibilityLabel = 'dialog.startRecording';
    toggledAccessibilityLabel = 'dialog.stopRecording';
    icon = IconRecord;
    label = 'dialog.startRecording';
    toggledLabel = 'dialog.stopRecording';
    toggledIcon = IconStop;

    /**
     * Returns the tooltip that should be displayed when the button is disabled.
     *
     * @private
     * @returns {string}
     */
    _getTooltip() {
        return this.props._tooltip ?? '';
    }

    /**
     * Helper function to be implemented by subclasses, which should be used
     * to handle the start recoding button being clicked / pressed.
     *
     * @protected
     * @returns {void}
     */
    _onHandleClick() {
        // To be implemented by subclass.
    }

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    async _handleClick() {
        const { _isRecordingRunning, dispatch } = this.props;

        sendAnalytics(createToolbarEvent(
            'recording.button',
            {
                'is_recording': _isRecordingRunning,
                type: JitsiRecordingConstants.mode.FILE
            }));
        const dialogShown = await dispatch(maybeShowPremiumFeatureDialog(MEET_FEATURES.RECORDING));

        if (!dialogShown) {
            this._onHandleClick();
        }
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
        return this.props._disabled;
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
 *     _disabled: boolean,
 *     _isRecordingRunning: boolean,
 *     _tooltip: string,
 *     visible: boolean
 * }}
 */
export function _mapStateToProps(state: IReduxState) {
    const {
        disabled: _disabled,
        tooltip: _tooltip,
        visible
    } = getRecordButtonProps(state);

    return {
        _disabled,
        _isRecordingRunning: isRecordingRunning(state),
        _tooltip,
        visible
    };
}
