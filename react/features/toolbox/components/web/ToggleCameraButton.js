// @flow

import { translate } from '../../../base/i18n';
import { IconCameraRefresh } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
import { isLocalCameraTrackMuted, isToggleCameraEnabled, toggleCamera } from '../../../base/tracks';

/**
 * The type of the React {@code Component} props of {@link ToggleCameraButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * Whether the current conference is in audio only mode or not.
     */
    _audioOnly: boolean,

    /**
     * Whether video is currently muted or not.
     */
    _videoMuted: boolean,

    /**
     * The Redux dispatch function.
     */
    dispatch: Function
};

/**
 * An implementation of a button for toggling the camera facing mode.
 */
class ToggleCameraButton extends AbstractButton<Props, any> {
    accessibilityLabel = 'toolbar.accessibilityLabel.toggleCamera';
    icon = IconCameraRefresh;
    label = 'toolbar.toggleCamera';

    /**
     * Handles clicking/pressing the button.
     *
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(toggleCamera());
    }

    /**
     * Whether this button is disabled or not.
     *
     * @returns {boolean}
     */
    _isDisabled() {
        return this.props._audioOnly || this.props._videoMuted;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code ToggleCameraButton} component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function mapStateToProps(state): Object {
    const { enabled: audioOnly } = state['features/base/audio-only'];
    const tracks = state['features/base/tracks'];

    return {
        _audioOnly: Boolean(audioOnly),
        _videoMuted: isLocalCameraTrackMuted(tracks),
        visible: isToggleCameraEnabled(state)
    };
}

export default translate(connect(mapStateToProps)(ToggleCameraButton));
