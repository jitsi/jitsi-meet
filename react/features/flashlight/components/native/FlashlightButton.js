// @flow

import { connect } from 'react-redux';

import { translate } from '../../../base/i18n';
import { AbstractButton } from '../../../base/toolbox';
import type { AbstractButtonProps } from '../../../base/toolbox';
import { CAMERA_FACING_MODE } from '../../../base/media/constants';
import { isLocalTrackMuted } from '../../../base/tracks';
import { MEDIA_TYPE } from '../../../base/media';
import { toggleFlashlight } from '../../actions';

/**
 * The type of the React {@code Component} props of {@link FlashlightButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * Whether the current conference is in audio only mode or not.
     */
    _audioOnly: boolean,

    /**
     * cameraFacingMode.
     */
    _cameraFacingMode: string,

    /**
     * Whether Flashlight is turn-on or off.
     */
    _isFlashlightOn: boolean,

    /**
     * Whether video is currently muted or not.
     */
    _videoMuted: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * An implementation of a button for toggling the flashlight.
 */
class FlashlightButton extends AbstractButton<Props, *> {
    iconName = 'camera-light-off';
    label = 'toolbar.flashlightOn';
    toggledIconName = 'camera-light';
    toggledLabel = 'toolbar.flashlightOff';

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(toggleFlashlight());
    }

    /**
     * Indicates whether this button is disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return this.props._audioOnly || this.props._videoMuted
            || this.props._cameraFacingMode === CAMERA_FACING_MODE.USER;
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._isFlashlightOn;
    }

}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code FlashlightButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioOnly: boolean,
 *     _cameraFacingMode: boolean,
 *     _isFlashlightOn: boolean,
 *     _videoMuted: boolean
 * }}
 */
function _mapStateToProps(state): Object {
    const { audioOnly } = state['features/base/conference'];
    const tracks = state['features/base/tracks'];
    const facingMode = state['features/base/media'].video.facingMode;
    const isFlashlightOn = state['features/flashlight'].isFlashlightOn;

    return {
        _audioOnly: Boolean(audioOnly),
        _cameraFacingMode: facingMode,
        _isFlashlightOn: isFlashlightOn,
        _videoMuted: isLocalTrackMuted(tracks, MEDIA_TYPE.VIDEO)
    };
}

export default translate(connect(_mapStateToProps)(FlashlightButton));
