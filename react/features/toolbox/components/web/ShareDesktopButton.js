// @flow

import React, { Component } from 'react';

import { isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n';
import { IconArrowUp } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { ToolboxButtonWithIcon } from '../../../base/toolbox/components';
import { getLocalJitsiVideoTrack } from '../../../base/tracks';
import { toggleShareScreenSettings, ScreenShareSettingsPopup } from '../../../settings';
import { getDesktopShareSettingsVisibility } from '../../../settings/functions';
import { isVideoSettingsButtonDisabled } from '../../functions';
import MainShareDesktopButton from '../MainShareDesktopButton';


type Props = {

    /**
     * Click handler for the small icon. Opens video options.
     */
    onDesktopShareOptionsClick: Function,

    /**
     * Indicates whether video permissions have been granted or denied.
     */
    hasPermissions: boolean,

    /**
     * Whether there is a video track or not.
     */
    hasVideoTrack: boolean,

    /**
     * If the button should be disabled
     */
    isDisabled: boolean,

    /**
     * Flag controlling the visibility of the button.
     * VideoSettings popup is currently disabled on mobile browsers
     * as mobile devices do not support capture of more than one
     * camera at a time.
     */
    visible: boolean,

    /**
     * Used for translation
     */
    t: Function,

    /**
     * Defines is popup is open
     */
    isOpen: boolean
};

/**
 * Button used for video & video settings.
 *
 * @returns {ReactElement}
 */
class ShareDesktopButton extends Component<Props> {
    /**
     * Initializes a new {@code AudioSettingsButton} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onEscClick = this._onEscClick.bind(this);
    }

    /**
     * Returns true if the settings icon is disabled.
     *
     * @returns {boolean}
     */
    _isIconDisabled() {
        const { hasPermissions, hasVideoTrack, isDisabled } = this.props;

        return (!hasPermissions || isDisabled) && !hasVideoTrack;
    }
    _onEscClick: (KeyboardEvent) => void;

    /**
     * Click handler for the more actions entries.
     *
     * @param {KeyboardEvent} event - Esc key click to close the popup.
     * @returns {void}
     */
    _onEscClick(event) {
        if (event.key === 'Escape' && this.props.isOpen) {
            event.preventDefault();
            event.stopPropagation();
            this.props.onDesktopShareOptionsClick();
        }
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { onDesktopShareOptionsClick, t, visible, isOpen } = this.props;

        return visible ? (
            <ScreenShareSettingsPopup>
                <ToolboxButtonWithIcon
                    ariaControls = 'video-settings-dialog'
                    ariaExpanded = { isOpen }
                    ariaHasPopup = { true }
                    ariaLabel = { this.props.t('toolbar.accessibilityLabel.shareYourScreen') }
                    icon = { IconArrowUp }
                    iconDisabled = { this._isIconDisabled() }
                    iconId = 'video-settings-button'
                    iconTooltip = { t('toolbar.otherScreenShareOptions') }
                    onIconClick = { onDesktopShareOptionsClick }
                    onIconKeyDown = { this._onEscClick }>
                    <MainShareDesktopButton />
                </ToolboxButtonWithIcon>
            </ScreenShareSettingsPopup>
        ) : <MainShareDesktopButton />;
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(state) {
    const { permissions = {} } = state['features/base/devices'];

    return {
        hasPermissions: permissions.video,
        hasVideoTrack: Boolean(getLocalJitsiVideoTrack(state)),
        isDisabled: isVideoSettingsButtonDisabled(state),
        isOpen: getDesktopShareSettingsVisibility(state),
        visible: !isMobileBrowser()
    };
}

const mapDispatchToProps = {
    onDesktopShareOptionsClick: toggleShareScreenSettings
};

export default translate(connect(
    mapStateToProps,
    mapDispatchToProps,
)(ShareDesktopButton));
