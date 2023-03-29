import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconScreenshare, IconStopScreenshare } from '../../../base/icons/svg';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import JitsiMeetJS from '../../../base/lib-jitsi-meet/_';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { isScreenVideoShared } from '../../../screen-share/functions';
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
    toggledIcon = IconStopScreenshare;
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
        _screensharing: isScreenVideoShared(state)
    };
};

export default translate(connect(mapStateToProps)(ShareDesktopButton));
