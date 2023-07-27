import { IReduxState } from '../../app/types';
import { VIDEO_MUTE_BUTTON_ENABLED } from '../../base/flags/constants';
import { getFeatureFlag } from '../../base/flags/functions';
import { MEDIA_TYPE } from '../../base/media/constants';
import { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import BaseVideoMuteButton from '../../base/toolbox/components/BaseVideoMuteButton';
import { isLocalTrackMuted } from '../../base/tracks/functions';
import { handleToggleVideoMuted } from '../actions.any';
import { isVideoMuteButtonDisabled } from '../functions';

/**
 * The type of the React {@code Component} props of {@link AbstractVideoMuteButton}.
 */
export interface IProps extends AbstractButtonProps {

    /**
     * Whether video button is disabled or not.
     */
    _videoDisabled: boolean;

    /**
     * Whether video is currently muted or not.
     */
    _videoMuted: boolean;
}

/**
 * Component that renders a toolbar button for toggling video mute.
 *
 * @augments BaseVideoMuteButton
 */
export default class AbstractVideoMuteButton<P extends IProps> extends BaseVideoMuteButton<P> {
    accessibilityLabel = 'toolbar.accessibilityLabel.videomute';
    toggledAccessibilityLabel = 'toolbar.accessibilityLabel.videounmute';
    label = 'toolbar.videomute';
    tooltip = 'toolbar.videomute';
    toggledTooltip = 'toolbar.videounmute';

    /**
     * Indicates if video is currently disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return this.props._videoDisabled;
    }

    /**
     * Indicates if video is currently muted or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isVideoMuted() {
        return this.props._videoMuted;
    }

    /**
     * Changes the muted state.
     *
     * @override
     * @param {boolean} videoMuted - Whether video should be muted or not.
     * @protected
     * @returns {void}
     */
    _setVideoMuted(videoMuted: boolean) {
        this.props.dispatch(handleToggleVideoMuted(videoMuted, true, true));
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code VideoMuteButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _videoMuted: boolean
 * }}
 */
export function mapStateToProps(state: IReduxState) {
    const tracks = state['features/base/tracks'];
    const enabledFlag = getFeatureFlag(state, VIDEO_MUTE_BUTTON_ENABLED, true);

    return {
        _videoDisabled: isVideoMuteButtonDisabled(state),
        _videoMuted: isLocalTrackMuted(tracks, MEDIA_TYPE.VIDEO),
        visible: enabledFlag
    };
}
