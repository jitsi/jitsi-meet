// @flow

import { ACTION_SHORTCUT_TRIGGERED, createToolbarEvent, sendAnalytics } from '../../analytics';
import { translate } from '../../base/i18n';
import { IconShareDesktop } from '../../base/icons';
import JitsiMeetJS from '../../base/lib-jitsi-meet/_';
import { connect } from '../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';
import { getLocalVideoTrack } from '../../base/tracks';
import { isScreenAudioShared, startScreenShareFlow } from '../../screen-share';
import { setOverflowMenuVisible } from '../../toolbox/actions';
import { toggleBackgroundEffect } from '../../virtual-background/actions';
import { VIRTUAL_BACKGROUND_TYPE } from '../../virtual-background/constants';


type Props = AbstractButtonProps & {

    /**
     * String showing if the virtual background type is desktop-share.
     */
    _backgroundType: String,

    /**
     * Whether or not screensharing is initialized.
     */
    _desktopSharingEnabled: boolean,

    /**
     * The tooltip key to use when screensharing is disabled. Or undefined
     * if non to be shown and the button to be hidden.
     */
    _desktopSharingDisabledTooltipKey: string,

    /**
     * The JitsiLocalTrack to display.
     */
    _localVideo: Object,

    /**
     * Whether or not the overflow menu is visible.
     */
    _overflowMenuVisible: boolean,

    /**
     * Whether or not the local participant is screensharing.
     */
    _screensharing: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * External handler for click action.
     */
    handleClick: Function,

    /**
     * Returns the selected virtual source object.
     */
    _virtualSource: Object
};

/**
 * Implementation of a button for sharing desktop / windows.
 */
class MainShareDesktopButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.shareYourScreen';
    label = 'toolbar.startScreenSharing';
    icon = IconShareDesktop;
    toggledLabel = 'toolbar.stopScreenSharing';
    tooltip = 'toolbar.accessibilityLabel.shareYourScreen';

    /**
     * Retrieves tooltip dynamically.
     */
    get tooltip() {
        const { _desktopSharingDisabledTooltipKey, _desktopSharingEnabled, _screensharing } = this.props;

        if (_desktopSharingEnabled) {
            if (_screensharing) {
                return 'toolbar.stopScreenSharing';
            }

            return 'toolbar.startScreenSharing';
        }

        return _desktopSharingDisabledTooltipKey;
    }

    /**
     * Required by linter due to AbstractButton overwritten prop being writable.
     *
     * @param {string} value - The icon value.
     */
    set tooltip(value) {
        return value;
    }

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        sendAnalytics(
            createToolbarEvent('toggle.screen.sharing', ACTION_SHORTCUT_TRIGGERED, {
                enable: !this.props._screensharing
            })
        );

        this._closeOverflowMenuIfOpen();
        this._doToggleScreenshare();
    }

    /**
     * Dispatches an action to toggle screensharing.
     *
     * @private
     * @param {boolean} enabled - The state to toggle screen sharing to.
     * @param {boolean} audioOnly - Only share system audio.
     * @returns {void}
     */
    _doToggleScreenshare() {
        const { _backgroundType, _desktopSharingEnabled, _localVideo, _virtualSource, dispatch } = this.props;

        if (_backgroundType === VIRTUAL_BACKGROUND_TYPE.DESKTOP_SHARE) {
            const noneOptions = {
                enabled: false,
                backgroundType: VIRTUAL_BACKGROUND_TYPE.NONE,
                selectedThumbnail: VIRTUAL_BACKGROUND_TYPE.NONE,
                backgroundEffectEnabled: false
            };

            _virtualSource.dispose();

            dispatch(toggleBackgroundEffect(noneOptions, _localVideo));

            return;
        }

        if (_desktopSharingEnabled) {
            dispatch(startScreenShareFlow());
        }
    }

    /**
     * Closes the overflow menu if opened.
     *
     * @private
     * @returns {void}
     */
    _closeOverflowMenuIfOpen() {
        const { dispatch, _overflowMenuVisible } = this.props;

        _overflowMenuVisible && dispatch(setOverflowMenuVisible(false));
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
    const localVideo = getLocalVideoTrack(state['features/base/tracks']);
    let desktopSharingEnabled = JitsiMeetJS.isDesktopSharingEnabled();
    const { enableFeaturesBasedOnToken } = state['features/base/config'];
    const { overflowMenuVisible } = state['features/toolbox'];
    let desktopSharingDisabledTooltipKey;

    if (enableFeaturesBasedOnToken) {
        // we enable desktop sharing if any participant already have this
        // feature enabled
        desktopSharingEnabled = state['features/base/participants'].haveParticipantWithScreenSharingFeature;
        desktopSharingDisabledTooltipKey = 'dialog.shareYourScreenDisabled';
    }

    return {
        _backgroundType: state['features/virtual-background'].backgroundType,
        _desktopSharingDisabledTooltipKey: desktopSharingDisabledTooltipKey,
        _desktopSharingEnabled: desktopSharingEnabled,
        _localVideo: localVideo,
        _overflowMenuVisible: overflowMenuVisible,
        _screensharing: (localVideo && localVideo.videoType === 'desktop') || isScreenAudioShared(state),
        _virtualSource: state['features/virtual-background'].virtualSource
    };
};

export default translate(connect(mapStateToProps)(MainShareDesktopButton));
