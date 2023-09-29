import { IReduxState } from '../../../app/types';
import { IconSites } from '../../../base/icons/svg';
import { MEET_FEATURES } from '../../../base/jwt/constants';
import { isJwtFeatureEnabled } from '../../../base/jwt/functions';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import { isLocalParticipantModerator } from '../../../base/participants/functions';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { isInBreakoutRoom } from '../../../breakout-rooms/functions';
import { maybeShowPremiumFeatureDialog } from '../../../jaas/actions';
import { getActiveSession } from '../../functions';

import { getLiveStreaming } from './functions';


/**
 * The type of the React {@code Component} props of
 * {@link AbstractLiveStreamButton}.
 */
export interface IProps extends AbstractButtonProps {

    /**
     * True if the button needs to be disabled.
     */
    _disabled: boolean;

    /**
     * True if there is a running active live stream, false otherwise.
     */
    _isLiveStreamRunning: boolean;

    /**
     * The tooltip to display when hovering over the button.
     */
    _tooltip?: string;
}

/**
 * An abstract class of a button for starting and stopping live streaming.
 */
export default class AbstractLiveStreamButton<P extends IProps> extends AbstractButton<P> {
    accessibilityLabel = 'dialog.startLiveStreaming';
    toggledAccessibilityLabel = 'dialog.stopLiveStreaming';
    icon = IconSites;
    label = 'dialog.startLiveStreaming';
    toggledLabel = 'dialog.stopLiveStreaming';

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
     * to handle the live stream button being clicked / pressed.
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
        const { dispatch } = this.props;

        const dialogShown = await dispatch(maybeShowPremiumFeatureDialog(MEET_FEATURES.RECORDING));

        if (!dialogShown) {
            this._onHandleClick();
        }
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
 * @param {IProps} ownProps - The own props of the Component.
 * @private
 * @returns {{
 *     _disabled: boolean,
 *     _isLiveStreamRunning: boolean,
 *     visible: boolean
 * }}
 */
export function _mapStateToProps(state: IReduxState, ownProps: IProps) {
    let { visible } = ownProps;

    // A button can be disabled/enabled only if enableFeaturesBasedOnToken
    // is on or if the recording is running.
    let _disabled = false;
    let _tooltip = '';

    if (typeof visible === 'undefined') {
        // If the containing component provides the visible prop, that is one
        // above all, but if not, the button should be autonomous and decide on
        // its own to be visible or not.
        const isModerator = isLocalParticipantModerator(state);
        const liveStreaming = getLiveStreaming(state);

        if (isModerator) {
            visible = liveStreaming.enabled ? isJwtFeatureEnabled(state, 'livestreaming', true) : false;
        } else {
            visible = false;
        }
    }

    // disable the button if the recording is running.
    if (visible && getActiveSession(state, JitsiRecordingConstants.mode.FILE)) {
        _disabled = true;
        _tooltip = 'dialog.liveStreamingDisabledBecauseOfActiveRecordingTooltip';
    }

    // disable the button if we are in a breakout room.
    if (isInBreakoutRoom(state)) {
        _disabled = true;
        visible = false;
    }

    return {
        _disabled,
        _isLiveStreamRunning: Boolean(getActiveSession(state, JitsiRecordingConstants.mode.STREAM)),
        _tooltip,
        visible
    };
}
