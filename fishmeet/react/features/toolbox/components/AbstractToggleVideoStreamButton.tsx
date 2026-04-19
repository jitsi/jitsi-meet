import { IReduxState } from '../../app/types';
import { VIDEO_STREAM_OFF_BUTTON_ENABLED } from '../../base/flags/constants';
import { getFeatureFlag } from '../../base/flags/functions';
import { IconVideoStreamOff, IconVideoStreamOn } from '../../base/icons/svg';
import { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import BaseVideoMuteButton from '../../base/toolbox/components/BaseVideoMuteButton';
import { toggleVideoStream } from '../../base/video-stream/actions';

/**
 * The type of the React {@code Component} props of {@link AbstractVideoMuteButton}.
 */
export interface IProps extends AbstractButtonProps {

    /**
     * Whether video button is disabled or not.
     */
    _disabled: boolean;

    /**
     * Whether video is currently muted or not.
     */
    _videoStreamOff: boolean;
}

/**
 * Component that renders a toolbar button for toggling video mute.
 *
 * @augments BaseVideoMuteButton
 */
export default class AbstractToggleVideoStreamButton<P extends IProps> extends BaseVideoMuteButton<P> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.videoStreamTurnOff';
    override toggledAccessibilityLabel = 'toolbar.accessibilityLabel.videoStreamTurnOn';
    override label = 'toolbar.videoStreamTurnOff';
    override toggledLabel = 'toolbar.videoStreamTurnOn';
    override tooltip = 'toolbar.videoStreamTurnOff';
    override toggledTooltip = 'toolbar.videoStreamTurnOn';

    override icon = IconVideoStreamOn;
    override toggledIcon = IconVideoStreamOff;

    /**
     * Indicates if video is currently disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isDisabled() {
        return this.props._disabled;
    }

    /**
     * Indicates if video is currently muted or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isVideoMuted() {
        return this.props._videoStreamOff;
    }

    /**
     * Changes the muted state.
     *
     * @override
     * @param {boolean} videoMuted - Whether video stream should be off or not.
     * @protected
     * @returns {void}
     */
    override _setVideoMuted(videoMuted: boolean) {
        this.props.dispatch(toggleVideoStream(!videoMuted));
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
    const { enable: enableVideoStream } = state['features/base/video-stream'];
    const enabledFlag = getFeatureFlag(state, VIDEO_STREAM_OFF_BUTTON_ENABLED, true);

    return {
        _disabled: false,
        _videoStreamOff: !enableVideoStream,
        visible: enabledFlag
    };
}
