// @flow

import { translate } from '../../../base/i18n';
import {IconSelfie, IconSwitchCamera} from '../../../base/icons';
import { MEDIA_TYPE, toggleCameraFacingMode } from '../../../base/media';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
import { isLocalTrackMuted } from '../../../base/tracks';

/**
 * The type of the React {@code Component} props of {@link ToggleCameraButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * An implementation of a button for toggling the camera facing mode.
 */
class NativeSelfieButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.nativeSelfie';
    icon = IconSelfie;
    label = 'toolbar.nativeSelfie';

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
       console.log('NativeSelfie');

    }

    /**
     * Indicates whether this button is disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return ;
    }
}

export default translate(connect()(NativeSelfieButton));
