// @flow

import { openDialog } from '../../../base/dialog';
import { IconLiveStreaming } from '../../../base/icons';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import { getLocalParticipant } from '../../../base/participants';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
import { getActiveSession } from '../../functions';

import {
    StartLiveStreamDialog,
    StopLiveStreamDialog
} from './_';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractLiveStreamButton}.
 */
export type Props = AbstractButtonProps & {

    /**
     * True if there is a running active live stream, false otherwise.
     */
    _isLiveStreamRunning: boolean,

    /**
     * True if the button needs to be disabled.
     */
    _disabled: Boolean,

    /**
     * The tooltip to display when hovering over the button.
     */
    _tooltip: ?String,

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
 * An abstract class of a button for starting and stopping live streaming.
 */
export default class AbstractLiveStreamButton<P: Props> extends AbstractButton<P, *> {
    accessibilityLabel = 'dialog.accessibilityLabel.liveStreaming';
    icon = IconLiveStreaming;
    label = 'dialog.startLiveStreaming';
    toggledLabel = 'dialog.stopLiveStreaming';

    /**
     * Returns the tooltip that should be displayed when the button is disabled.
     *
     * @private
     * @returns {string}
     */
    _getTooltip() {
        return this.props._tooltip || '';
    }

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { _isLiveStreamRunning, dispatch } = this.props;

        dispatch(openDialog(
            _isLiveStreamRunning ? StopLiveStreamDialog : StartLiveStreamDialog
        ));
    }

    /**
     * Returns a boolean value indicating if this button is disabled or not.
     *
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
        return this.props._isLiveStreamRunning;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code AbstractLiveStreamButton} component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the Component.
 * @private
 * @returns {{
 *     _disabled: boolean,
 *     _isLiveStreamRunning: boolean,
 *     visible: boolean
 * }}
 */
export function _mapStateToProps(state: Object, ownProps: Props) {
    let { visible } = ownProps;

    // A button can be disabled/enabled only if enableFeaturesBasedOnToken
    // is on or if the recording is running.
    let _disabled;
    let _tooltip = '';

    if (typeof visible === 'undefined') {
        // If the containing component provides the visible prop, that is one
        // above all, but if not, the button should be autonomus and decide on
        // its own to be visible or not.
        const {
            enableFeaturesBasedOnToken,
            liveStreamingEnabled
        } = state['features/base/config'];
        const { features = {} } = getLocalParticipant(state);

        visible = liveStreamingEnabled;

        if (enableFeaturesBasedOnToken) {
            visible = visible && String(features.livestreaming) === 'true';
            _disabled = String(features.livestreaming) === 'disabled';

            if (!visible && !_disabled) {
                _disabled = true;
                visible = true;

                // button and tooltip
                if (state['features/base/jwt'].isGuest) {
                    _tooltip = 'dialog.liveStreamingDisabledForGuestTooltip';
                } else {
                    _tooltip = 'dialog.liveStreamingDisabledTooltip';
                }
            }
        }
    }

    // disable the button if the recording is running.
    if (getActiveSession(state, JitsiRecordingConstants.mode.FILE)) {
        _disabled = true;
        _tooltip = 'dialog.liveStreamingDisabledBecauseOfActiveRecordingTooltip';
    }

    return {
        _disabled,
        _isLiveStreamRunning: Boolean(
            getActiveSession(state, JitsiRecordingConstants.mode.STREAM)),
        _tooltip,
        visible
    };
}
