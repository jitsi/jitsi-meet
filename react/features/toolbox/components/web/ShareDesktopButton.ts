import { connect } from 'react-redux';
import { withStyles } from 'tss-react/mui';

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
import { isDesktopShareButtonDisabled } from '../../functions.web';

interface IProps extends AbstractButtonProps {

    /**
     * Whether or not screen-sharing is initialized.
     */
    _desktopSharingEnabled: boolean;

    /**
     * Whether or not the local participant is screen-sharing.
     */
    _screensharing: boolean;
}

/**
 * Implementation of a button for sharing desktop / windows.
 */
class ShareDesktopButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.shareYourScreen';
    override toggledAccessibilityLabel = 'toolbar.accessibilityLabel.stopScreenSharing';
    override label = 'toolbar.startScreenSharing';
    override icon = IconScreenshare; // This will use the new SVG
    override toggledLabel = 'toolbar.stopScreenSharing';

    /**
     * Overrides AbstractButton's_className to apply new styles.
     *
     * @override
     * @protected
     * @returns {string}
     */
    override get _className() {
        // @ts-ignore
        const classes = withStyles.getClasses(this.props);
        let className = `dribbble-toolbox-button ${classes.button_override}`;

        if (this._isToggled()) {
            className += ` ${classes.toggledButton}`;
        }

        if (this._isDisabled()) {
            className += ' disabled';
        }

        return className;
    }

    /**
     * Retrieves tooltip dynamically.
     *
     * @returns {string}
     */
    override _getTooltip() {
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
    override _isToggled() {
        return this.props._screensharing;
    }

    /**
     * Indicates whether this button is in disabled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isDisabled() {
        return !this.props._desktopSharingEnabled;
    }

    /**
     * Handles clicking the button, and toggles the chat.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
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
    // Disable the screen-share button if the video sender limit is reached and there is no video or media share in
    // progress.
    const desktopSharingEnabled
        = JitsiMeetJS.isDesktopSharingEnabled() && !isDesktopShareButtonDisabled(state);

    return {
        _desktopSharingEnabled: desktopSharingEnabled,
        _screensharing: isScreenVideoShared(state),
        visible: JitsiMeetJS.isDesktopSharingEnabled()
    };
};

// Define styles similar to AudioMuteButton and VideoMuteButton
// TODO: Ideally, these should come from a theme provider or imported from SCSS variables
// For now, hardcoding based on _variables.scss
const themeColors = {
    backgroundColorDark: '#1A1E2D',
    textColorPrimary: '#FFFFFF',
    primaryColor: '#7B61FF',
    disabledColor: '#5E6272', // A dimmer color for disabled state
    hoverColor: '#252A3A' // Slightly lighter than backgroundColorDark for hover
};

// @ts-ignore
const styles = _theme => { // tss-react can take theme as an argument
    return {
        button_override: { // Class to apply to the AbstractButton
            backgroundColor: themeColors.backgroundColorDark,
            borderRadius: '50%',
            width: '44px', // Adjust size as needed
            height: '44px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 4px',
            border: 'none',
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',

            '&.disabled': {
                backgroundColor: themeColors.disabledColor,
                boxShadow: 'none',
                cursor: 'not-allowed',
                '& .jitsi-icon svg': {
                    fill: themeColors.textColorPrimary + '80',
                }
            },
            '&:not(.disabled):hover': {
                backgroundColor: themeColors.hoverColor,
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
            },
            '& .jitsi-icon svg': {
                fill: themeColors.textColorPrimary,
                width: '24px',
                height: '24px',
            },
        },
        toggledButton: { // Specifically for when screen sharing is "on"
            '& .jitsi-icon svg': {
                fill: themeColors.primaryColor, // Purple icon when sharing
            }
        }
        // No pendingContainer needed for screenshare button as it doesn't have GUM pending state
    };
};

// Apply withStyles HOC
// @ts-ignore
export default translate(connect(mapStateToProps)(withStyles(ShareDesktopButton, styles)));
