import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconVolumeOff, IconVolumeUp } from '../../../base/icons/svg';
import JitsiMeetJS from '../../../base/lib-jitsi-meet';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { setOverflowMenuVisible } from '../../../toolbox/actions.web';
import { startAudioScreenShareFlow } from '../../actions.web';
import { isAudioOnlySharing, isScreenAudioSupported } from '../../functions';

interface IProps extends AbstractButtonProps {

    /**
     * Whether or not the local participant is audio only screen sharing.
     */
    _isAudioOnlySharing: boolean;
}

/**
 * Component that renders a toolbar button for toggling audio only screen share.
 */
class ShareAudioButton extends AbstractButton<IProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.shareaudio';
    icon = IconVolumeUp;
    label = 'toolbar.shareaudio';
    tooltip = 'toolbar.shareaudio';
    toggledIcon = IconVolumeOff;
    toggledLabel = 'toolbar.stopAudioSharing';

    /**
     * Handles clicking / pressing the button, and opens a new dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch } = this.props;

        dispatch(startAudioScreenShareFlow());
        dispatch(setOverflowMenuVisible(false));
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._isAudioOnlySharing;
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {

    return {
        _isAudioOnlySharing: Boolean(isAudioOnlySharing(state)),
        visible: JitsiMeetJS.isDesktopSharingEnabled() && isScreenAudioSupported()
    };
}

export default translate(connect(_mapStateToProps)(ShareAudioButton));
