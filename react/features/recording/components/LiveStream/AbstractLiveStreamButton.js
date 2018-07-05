// @flow

import { openDialog } from '../../../base/dialog';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import {
    isLocalParticipantModerator,
    getLocalParticipant
} from '../../../base/participants';
import {
    AbstractButton,
    type AbstractButtonProps
} from '../../../base/toolbox';

import { getActiveSession } from '../../functions';

import StartLiveStreamDialog from './StartLiveStreamDialog';
import StopLiveStreamDialog from './StopLiveStreamDialog';

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
export default class AbstractLiveStreamButton<P: Props>
    extends AbstractButton<P, *> {
    accessibilityLabel = 'dialog.accessibilityLabel.liveStreaming';
    label = 'dialog.startLiveStreaming';
    toggledLabel = 'dialog.stopLiveStreaming';

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
 *     _isLiveStreamRunning: boolean,
 *     visible: boolean
 * }}
 */
export function _mapStateToProps(state: Object, ownProps: Props) {
    let { visible } = ownProps;

    if (typeof visible === 'undefined') {
        // If the containing component provides the visible prop, that is one
        // above all, but if not, the button should be autonomus and decide on
        // its own to be visible or not.
        const isModerator = isLocalParticipantModerator(state);
        const {
            enableFeaturesBasedOnToken,
            liveStreamingEnabled
        } = state['features/base/config'];
        const { features = {} } = getLocalParticipant(state);

        visible = isModerator
            && liveStreamingEnabled
            && (!enableFeaturesBasedOnToken
                || String(features.livestreaming) === 'true');
    }

    return {
        _isLiveStreamRunning: Boolean(
            getActiveSession(state, JitsiRecordingConstants.mode.STREAM)),
        visible
    };
}
