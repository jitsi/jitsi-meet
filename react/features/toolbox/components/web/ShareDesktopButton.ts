import { connect } from 'react-redux';

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconScreenshare } from '../../../base/icons/svg';
import JitsiMeetJS from '../../../base/lib-jitsi-meet/_';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { startScreenShareFlow } from '../../../screen-share/actions.web';
import { isScreenVideoShared } from '../../../screen-share/functions';
import { closeOverflowMenuIfOpen } from '../../actions.web';
import { isDesktopShareButtonDisabled } from '../../functions';

interface IProps extends AbstractButtonProps {

    /**
     * Whether or not screensharing is initialized.
     */
    _desktopSharingEnabled: boolean;

    /**
     * Whether or not the local participant is screensharing.
     */
    _screensharing: boolean;
}

/**
 * Implementation of a button for sharing desktop / windows.
 */
class ShareDesktopButton extends AbstractButton<IProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.shareYourScreen';
    toggledAccessibilityLabel = 'toolbar.accessibilityLabel.stopScreenSharing';
    label = 'toolbar.startScreenSharing';
    icon = IconScreenshare;
    toggledLabel = 'toolbar.stopScreenSharing';

    /**
     * Retrieves tooltip dynamically.
     *
     * @returns {string}
     */
    _getTooltip() {
        const { _desktopSharingEnabled, _screensharing } = this.props;

        if (_desktopSharingEnabled) {
            if (_screensharing) {
                return 'toolbar.stopScreenSharing';
            }

            return 'toolbar.startScreenSharing';
        }

        return 'dialog.shareYourScreenDisabled';
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

    /**
     * Indicates whether this button is in disabled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return !this.props._desktopSharingEnabled;
    }

    /**
     * Handles clicking the button, and toggles the chat.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, _screensharing } = this.props;

        sendAnalytics(createToolbarEvent(
            'toggle.screen.sharing',
            { enable: !_screensharing }));

        dispatch(closeOverflowMenuIfOpen());
        dispatch(startScreenShareFlow(!_screensharing));
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
*
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
const mapStateToProps = (state: IReduxState) => {
    // Disable the screenshare button if the video sender limit is reached and there is no video or media share in
    // progress.
    const desktopSharingEnabled
        = JitsiMeetJS.isDesktopSharingEnabled() && !isDesktopShareButtonDisabled(state);

    return {
        _desktopSharingEnabled: desktopSharingEnabled,
        _screensharing: isScreenVideoShared(state),
        visible: JitsiMeetJS.isDesktopSharingEnabled()
    };
};

export default translate(connect(mapStateToProps)(ShareDesktopButton));
