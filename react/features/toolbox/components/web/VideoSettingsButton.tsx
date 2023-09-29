import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n/functions';
import { IconArrowUp } from '../../../base/icons/svg';
import { IGUMPendingState } from '../../../base/media/types';
import ToolboxButtonWithIcon from '../../../base/toolbox/components/web/ToolboxButtonWithIcon';
import { getLocalJitsiVideoTrack } from '../../../base/tracks/functions.web';
import { toggleVideoSettings } from '../../../settings/actions';
import VideoSettingsPopup from '../../../settings/components/web/video/VideoSettingsPopup';
import { getVideoSettingsVisibility } from '../../../settings/functions.web';
import { isVideoSettingsButtonDisabled } from '../../functions.web';

import VideoMuteButton from './VideoMuteButton';


interface IProps extends WithTranslation {

    /**
     * The button's key.
     */
    buttonKey?: string;

    /**
     * The gumPending state from redux.
     */
    gumPending: IGUMPendingState;

    /**
     * External handler for click action.
     */
    handleClick: Function;

    /**
     * Indicates whether video permissions have been granted or denied.
     */
    hasPermissions: boolean;

    /**
     * Whether there is a video track or not.
     */
    hasVideoTrack: boolean;

    /**
     * If the button should be disabled.
     */
    isDisabled: boolean;

    /**
     * Defines is popup is open.
     */
    isOpen: boolean;

    /**
     * Notify mode for `toolbarButtonClicked` event -
     * whether to only notify or to also prevent button click routine.
     */
    notifyMode?: string;

    /**
     * Click handler for the small icon. Opens video options.
     */
    onVideoOptionsClick: Function;

    /**
     * Flag controlling the visibility of the button.
     * VideoSettings popup is currently disabled on mobile browsers
     * as mobile devices do not support capture of more than one
     * camera at a time.
     */
    visible: boolean;
}

/**
 * Button used for video & video settings.
 *
 * @returns {ReactElement}
 */
class VideoSettingsButton extends Component<IProps> {
    /**
     * Initializes a new {@code VideoSettingsButton} instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
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
        const { gumPending, hasPermissions, hasVideoTrack, isDisabled } = this.props;

        return ((!hasPermissions || isDisabled) && !hasVideoTrack) || gumPending !== IGUMPendingState.NONE;
    }

    /**
     * Click handler for the more actions entries.
     *
     * @param {KeyboardEvent} event - Esc key click to close the popup.
     * @returns {void}
     */
    _onEscClick(event: React.KeyboardEvent) {
        if (event.key === 'Escape' && this.props.isOpen) {
            event.preventDefault();
            event.stopPropagation();
            this._onClick();
        }
    }

    /**
     * Click handler for the more actions entries.
     *
     * @param {MouseEvent} e - Mousw event.
     * @returns {void}
     */
    _onClick(e?: React.MouseEvent) {
        const { onVideoOptionsClick, isOpen } = this.props;

        if (isOpen) {
            e?.stopPropagation();
        }
        onVideoOptionsClick();
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { gumPending, t, visible, isOpen, buttonKey, notifyMode } = this.props;

        return visible ? (
            <VideoSettingsPopup>
                <ToolboxButtonWithIcon
                    ariaControls = 'video-settings-dialog'
                    ariaExpanded = { isOpen }
                    ariaHasPopup = { true }
                    ariaLabel = { this.props.t('toolbar.videoSettings') }
                    buttonKey = { buttonKey }
                    icon = { IconArrowUp }
                    iconDisabled = { this._isIconDisabled() || gumPending !== IGUMPendingState.NONE }
                    iconId = 'video-settings-button'
                    iconTooltip = { t('toolbar.videoSettings') }
                    notifyMode = { notifyMode }
                    onIconClick = { this._onClick }
                    onIconKeyDown = { this._onEscClick }>
                    <VideoMuteButton
                        buttonKey = { buttonKey }
                        notifyMode = { notifyMode } />
                </ToolboxButtonWithIcon>
            </VideoSettingsPopup>
        ) : <VideoMuteButton
            buttonKey = { buttonKey }
            notifyMode = { notifyMode } />;
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(state: IReduxState) {
    const { permissions = { video: false } } = state['features/base/devices'];
    const { isNarrowLayout } = state['features/base/responsive-ui'];
    const { gumPending } = state['features/base/media'].video;

    return {
        gumPending,
        hasPermissions: permissions.video,
        hasVideoTrack: Boolean(getLocalJitsiVideoTrack(state)),
        isDisabled: isVideoSettingsButtonDisabled(state),
        isOpen: Boolean(getVideoSettingsVisibility(state)),
        visible: !isMobileBrowser() && !isNarrowLayout
    };
}

const mapDispatchToProps = {
    onVideoOptionsClick: toggleVideoSettings
};

export default translate(connect(
    mapStateToProps,
    mapDispatchToProps
)(VideoSettingsButton));
