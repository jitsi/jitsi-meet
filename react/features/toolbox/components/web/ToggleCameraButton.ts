import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconCameraRefresh } from '../../../base/icons/svg';
import { MEDIA_TYPE } from '../../../base/media/constants';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { toggleCamera } from '../../../base/tracks/actions';
import { isLocalTrackMuted, isToggleCameraEnabled } from '../../../base/tracks/functions';
import { setOverflowMenuVisible } from '../../actions.web';

/**
 * The type of the React {@code Component} props of {@link ToggleCameraButton}.
 */
interface IProps extends AbstractButtonProps {

    /**
     * Whether the current conference is in audio only mode or not.
     */
    _audioOnly: boolean;

    /**
     * Whether video is currently muted or not.
     */
    _videoMuted: boolean;
}

/**
 * An implementation of a button for toggling the camera facing mode.
 */
class ToggleCameraButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.toggleCamera';
    override icon = IconCameraRefresh;
    override label = 'toolbar.toggleCamera';

    /**
     * Handles clicking/pressing the button.
     *
     * @returns {void}
     */
    override _handleClick() {
        const { dispatch } = this.props;

        dispatch(toggleCamera());
        dispatch(setOverflowMenuVisible(false));
    }

    /**
     * Whether this button is disabled or not.
     *
     * @returns {boolean}
     */
    override _isDisabled() {
        return this.props._audioOnly || this.props._videoMuted;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code ToggleCameraButton} component.
 *
 * @param {Object} state - The Redux state.
 * @returns {IProps}
 */
function mapStateToProps(state: IReduxState) {
    const { enabled: audioOnly } = state['features/base/audio-only'];
    const tracks = state['features/base/tracks'];

    return {
        _audioOnly: Boolean(audioOnly),
        _videoMuted: isLocalTrackMuted(tracks, MEDIA_TYPE.VIDEO),
        visible: isToggleCameraEnabled(state)
    };
}

export default translate(connect(mapStateToProps)(ToggleCameraButton));
