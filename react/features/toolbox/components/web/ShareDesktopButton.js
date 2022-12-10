// @flow

import { translate } from '../../../base/i18n';
import { IconScreenshare, IconStopScreenshare } from '../../../base/icons';
import JitsiMeetJS from '../../../base/lib-jitsi-meet/_';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
import { isScreenVideoShared } from '../../../screen-share/functions';
import { isDesktopShareButtonDisabled } from '../../functions';

type Props = AbstractButtonProps & {

    /**
     * Whether or not screensharing is initialized.
     */
    _desktopSharingEnabled: boolean,

    /**
     * Whether or not the local participant is screensharing.
     */
    _screensharing: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,
};

/**
 * Implementation of a button for sharing desktop / windows.
 */
class ShareDesktopButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.shareYourScreen';
    label = 'toolbar.startScreenSharing';
    icon = IconScreenshare;
    toggledIcon = IconStopScreenshare;
    toggledLabel = 'toolbar.stopScreenSharing';
    tooltip = 'toolbar.accessibilityLabel.shareYourScreen';

    /**
     * Retrieves tooltip dynamically.
     */
    get tooltip() {
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
     * Required by linter due to AbstractButton overwritten prop being writable.
     *
     * @param {string} _value - The icon value.
     */
    set tooltip(_value) {
        // Unused.
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
const mapStateToProps = state => {
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
