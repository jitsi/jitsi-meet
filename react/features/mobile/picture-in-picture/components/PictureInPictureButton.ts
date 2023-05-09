import { NativeModules, Platform } from 'react-native';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { PIP_ENABLED, PIP_WHILE_SCREEN_SHARING_ENABLED } from '../../../base/flags/constants';
import { getFeatureFlag } from '../../../base/flags/functions';
import { translate } from '../../../base/i18n/functions';
import { IconArrowDown } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { isLocalVideoTrackDesktop } from '../../../base/tracks/functions.native';
import { enterPictureInPicture } from '../actions';

interface IProps extends AbstractButtonProps {

    /**
     * Whether Picture-in-Picture is enabled or not.
     */
    _enabled: boolean;
}

/**
 * An implementation of a button for entering Picture-in-Picture mode.
 */
class PictureInPictureButton extends AbstractButton<IProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.pip';
    icon = IconArrowDown;
    label = 'toolbar.pip';

    /**
     * Handles clicking / pressing the button.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(enterPictureInPicture());
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {React$Node}
     */
    render() {
        return this.props._enabled ? super.render() : null;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code PictureInPictureButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _enabled: boolean
 * }}
 */
function _mapStateToProps(state: IReduxState) {
    const pipEnabled = Boolean(getFeatureFlag(state, PIP_ENABLED));
    const pipWhileScreenSharingEnabled = getFeatureFlag(state, PIP_WHILE_SCREEN_SHARING_ENABLED, false);

    let enabled = pipEnabled && (!isLocalVideoTrackDesktop(state) || pipWhileScreenSharingEnabled);

    // Override flag for Android, since it might be unsupported.
    if (Platform.OS === 'android' && !NativeModules.PictureInPicture.SUPPORTED) {
        enabled = false;
    }

    return {
        _enabled: enabled
    };
}

export default translate(connect(_mapStateToProps)(PictureInPictureButton));
