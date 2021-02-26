// @flow

import { createVideoBlurEvent, sendAnalytics } from '../../analytics';
import { translate } from '../../base/i18n';
import { IconBlurBackground } from '../../base/icons';
import { connect } from '../../base/redux';
import { AbstractButton } from '../../base/toolbox/components';
import type { AbstractButtonProps } from '../../base/toolbox/components';
import { getLocalVideoTrack } from '../../base/tracks';
import { toggleBlurEffect } from '../actions';

/**
 * The type of the React {@code Component} props of {@link VideoBlurButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * True if the video background is blurred or false if it is not.
     */
    _isVideoBlurred: boolean,

    /**
     * Flag signaling the visibility of camera preview.
     */
    videoMuted: boolean,

    /**
     * The JitsiLocalTrack to display.
     */
    videoTrack: ?Object,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function

};

/**
 * An abstract implementation of a button that toggles the video blur effect.
 */
class VideoBlurButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.videoblur';
    icon = IconBlurBackground;
    label = 'toolbar.startvideoblur';
    tooltip = 'toolbar.startvideoblur';
    toggledLabel = 'toolbar.stopvideoblur';

    /**
     * Handles clicking / pressing the button, and toggles the blur effect
     * state accordingly.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { _isVideoBlurred, dispatch } = this.props;
        const value = !_isVideoBlurred;

        sendAnalytics(createVideoBlurEvent(value ? 'started' : 'stopped'));
        dispatch(toggleBlurEffect(value));
    }

    /**
     * Returns {@code boolean} value indicating if the blur effect is
     * enabled or not.
     *
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._isVideoBlurred;
    }

    /**
     * Returns {@code boolean} value indicating if disabled state is
     * enabled or not. This checks two cases of true value. The first one
     * checks the case when user join meeting with disabled camera. The
     * second case is when user join meeting with enabled camera, but then
     * he disables it.
     *
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        if (this.props.videoMuted) {
            return true;
        }
        if (!this.props.videoTrack) {
            return true;
        }
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code VideoBlurButton} component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the component.
 * @private
 * @returns {{
 *     _isVideoBlurred: boolean
 * }}
 */
function _mapStateToProps(state, ownProps): Object {

    return {
        videoMuted: ownProps.videoTrack ? ownProps.videoMuted : state['features/base/media'].video.muted,
        videoTrack: ownProps.videoTrack || (getLocalVideoTrack(state['features/base/tracks']) || {}).jitsiTrack
    };
}

export default translate(connect(_mapStateToProps)(VideoBlurButton));
