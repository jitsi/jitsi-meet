// @flow

import { translate } from '../../../base/i18n';
import { IconCameraRefresh } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
import { isLocalCameraTrackMuted, toggleCamera } from '../../../base/tracks';

/**
 * The type of the React {@code Component} props of {@link ToggleCameraButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * Whether the current conference is in audio only mode or not.
     */
    audioOnly: boolean,

    /**
     * The action that is dispatched when clicking/pressing the button.
     */
    onToggleCameraClick: Function,

    /**
     * Whether video is currently muted or not.
     */
    videoMuted: boolean
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
        this.props.onToggleCameraClick();
    }

    /**
     * Whether this button is disabled or not.
     *
     * @returns {boolean}
     */
    _isDisabled() {
        return this.props.audioOnly || this.props.videoMuted;
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
        audioOnly: Boolean(audioOnly),
        videoMuted: isLocalCameraTrackMuted(tracks)
    };
}

const mapDispatchToProps = {
    onToggleCameraClick: () => toggleCamera()
};

export default translate(connect(mapStateToProps, mapDispatchToProps)(ToggleCameraButton));
