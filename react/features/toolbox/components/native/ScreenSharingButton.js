// @flow

import { Platform } from 'react-native';

import { translate } from '../../../base/i18n';
import { IconShareDesktop } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
import { toggleScreensharing, isLocalVideoTrackDesktop } from '../../../base/tracks';
import { getLocalParticipant, PARTICIPANT_ROLE } from '../../../base/participants';
/**
 * The type of the React {@code Component} props of {@link ScreenSharingButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * Whether video is currently muted or not.
     */
    _screensharing: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * An implementation of a button for toggling screen sharing.
 */
class ScreenSharingButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.shareYourScreen';
    icon = IconShareDesktop;
    label = 'toolbar.startScreenSharing';
    toggledLabel = 'toolbar.stopScreenSharing';

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(toggleScreensharing());
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._screensharing;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code ToggleCameraButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _disabled: boolean,
 *     _screensharing: boolean
 * }}
 */
function _mapStateToProps(state): Object {
    const _localParticipant = getLocalParticipant(state);
    const isModerator = _localParticipant.role === PARTICIPANT_ROLE.MODERATOR;
    const MODERATOR_KEYS = state['features/base/config'].HOPP_MODERATOR_KEYS
    var visible_generally = true
    if (MODERATOR_KEYS){
        visible_generally = visible_generally && isModerator && MODERATOR_KEYS.includes('screenshare')
    }
    return {
        _screensharing: isLocalVideoTrackDesktop(state),
        visible: Platform.OS === 'android' && visible_generally
    };
}

export default translate(connect(_mapStateToProps)(ScreenSharingButton));
