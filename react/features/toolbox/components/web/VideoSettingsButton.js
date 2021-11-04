// @flow

import React, { Component } from 'react';

import { isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n';
import { IconArrowUp } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { ToolboxButtonWithIcon } from '../../../base/toolbox/components';
import { getLocalJitsiVideoTrack } from '../../../base/tracks';
import { toggleVideoSettings, VideoSettingsPopup } from '../../../settings';
import { getVideoSettingsVisibility } from '../../../settings/functions';
import { isVideoSettingsButtonDisabled } from '../../functions';
import VideoMuteButton from '../VideoMuteButton';


type Props = {

    /**
     * External handler for click action.
     */
    handleClick: Function,

    /**
     * Click handler for the small icon. Opens video options.
     */
    onVideoOptionsClick: Function,

    /**
     * Indicates whether video permissions have been granted or denied.
     */
    hasPermissions: boolean,

    /**
     * Whether there is a video track or not.
     */
    hasVideoTrack: boolean,

    /**
     * If the button should be disabled.
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
     * Used for translation.
     */
    t: Function,

    /**
     * Defines is popup is open.
     */
    isOpen: boolean
};

/**
 * Button used for video & video settings.
 *
 * @returns {ReactElement}
 */
class VideoSettingsButton extends Component<Props> {
    /**
     * Initializes a new {@code VideoSettingsButton} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onEscClick = this._onEscClick.bind(this);
        this._onClick = this._onClick.bind(this);
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
            this._onClick();
        }
    }

    _onClick: () => void;

    /**
     * Click handler for the more actions entries.
     *
     * @returns {void}
     */
    _onClick() {
        const { handleClick, onVideoOptionsClick } = this.props;

        if (handleClick) {
            handleClick();

            return;
        }

        onVideoOptionsClick();
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { handleClick, t, visible, isOpen } = this.props;

        return visible ? (
            <VideoSettingsPopup>
                <ToolboxButtonWithIcon
                    ariaControls = 'video-settings-dialog'
                    ariaExpanded = { isOpen }
                    ariaHasPopup = { true }
                    ariaLabel = { this.props.t('toolbar.videoSettings') }
                    icon = { IconArrowUp }
                    iconDisabled = { this._isIconDisabled() }
                    iconId = 'video-settings-button'
                    iconTooltip = { t('toolbar.videoSettings') }
                    onIconClick = { this._onClick }
                    onIconKeyDown = { this._onEscClick }>
                    <VideoMuteButton handleClick = { handleClick } />
                </ToolboxButtonWithIcon>
            </VideoSettingsPopup>
        ) : <VideoMuteButton handleClick = { handleClick } />;
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
        isOpen: getVideoSettingsVisibility(state),
        visible: !isMobileBrowser()
    };
}

const mapDispatchToProps = {
    onVideoOptionsClick: toggleVideoSettings
};

export default translate(connect(
    mapStateToProps,
    mapDispatchToProps
)(VideoSettingsButton));
