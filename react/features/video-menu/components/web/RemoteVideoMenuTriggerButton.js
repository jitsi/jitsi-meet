// @flow

/* eslint-disable react/jsx-handler-names */
import React, { Component } from 'react';
import { batch } from 'react-redux';

import ConnectionIndicatorContent from
    '../../../../features/connection-indicator/components/web/ConnectionIndicatorContent';
import { isIosMobileBrowser, isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n';
import { Icon, IconMenuThumb } from '../../../base/icons';
import { getLocalParticipant, getParticipantById, PARTICIPANT_ROLE } from '../../../base/participants';
import { Popover } from '../../../base/popover';
import { connect } from '../../../base/redux';
import { setParticipantContextMenuOpen } from '../../../base/responsive-ui/actions';
import { requestRemoteControl, stopController } from '../../../remote-control';
import { getCurrentLayout, LAYOUTS } from '../../../video-layout';
import { renderConnectionStatus } from '../../actions.web';

import ConnectionStatusButton from './ConnectionStatusButton';
import MuteEveryoneElseButton from './MuteEveryoneElseButton';
import MuteEveryoneElsesVideoButton from './MuteEveryoneElsesVideoButton';
import { REMOTE_CONTROL_MENU_STATES } from './RemoteControlButton';


import {
    GrantModeratorButton,
    MuteButton,
    MuteVideoButton,
    KickButton,
    PrivateMessageMenuButton,
    RemoteControlButton,
    VideoMenu,
    VolumeSlider
} from './';

declare var $: Object;

/**
 * The type of the React {@code Component} props of
 * {@link RemoteVideoMenuTriggerButton}.
 */
type Props = {

    /**
     * Hides popover.
     */
     hidePopover: Function,

    /**
     * Whether the popover is visible or not.
     */
     popoverVisible: boolean,

    /**
     * Shows popover.
     */
     showPopover: Function,

    /**
     * Whether or not to display the kick button.
     */
    _disableKick: boolean,

    /**
     * Whether or not to display the remote mute buttons.
     */
    _disableRemoteMute: Boolean,

    /**
     * Whether or not to display the grant moderator button.
     */
    _disableGrantModerator: Boolean,

    /**
     * Whether or not the participant is a conference moderator.
     */
    _isModerator: boolean,

    /**
     * The position relative to the trigger the remote menu should display
     * from. Valid values are those supported by AtlasKit
     * {@code InlineDialog}.
     */
    _menuPosition: string,

    /**
     * Whether to display the Popover as a drawer.
     */
    _overflowDrawer: boolean,

    /**
     * The current state of the participant's remote control session.
     */
    _remoteControlState: number,

    /**
     * The redux dispatch function.
     */
    dispatch: Function,

    /**
     * Gets a ref to the current component instance.
     */
    getRef: Function,

    /**
     * A value between 0 and 1 indicating the volume of the participant's
     * audio element.
     */
    initialVolumeValue: ?number,

    /**
     * Callback to invoke when changing the level of the participant's
     * audio element.
     */
    onVolumeChange: Function,

    /**
     * The ID for the participant on which the remote video menu will act.
     */
    participantID: string,

    /**
     * The ID for the participant on which the remote video menu will act.
     */
    _participantDisplayName: string,

    /**
     * Whether the popover should render the Connection Info stats.
     */
    _showConnectionInfo: Boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * React {@code Component} for displaying an icon associated with opening the
 * the {@code VideoMenu}.
 *
 * @extends {Component}
 */
class RemoteVideoMenuTriggerButton extends Component<Props> {

    /**
     * Initializes a new RemoteVideoMenuTriggerButton instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this._onPopoverClose = this._onPopoverClose.bind(this);
        this._onPopoverOpen = this._onPopoverOpen.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _overflowDrawer,
            _showConnectionInfo,
            _participantDisplayName,
            participantID,
            popoverVisible
        } = this.props;
        const content = _showConnectionInfo
            ? <ConnectionIndicatorContent participantId = { participantID } />
            : this._renderRemoteVideoMenu();

        if (!content) {
            return null;
        }

        const username = _participantDisplayName;

        return (
            <Popover
                content = { content }
                id = 'remote-video-menu-trigger'
                onPopoverClose = { this._onPopoverClose }
                onPopoverOpen = { this._onPopoverOpen }
                position = { this.props._menuPosition }
                visible = { popoverVisible }>
                {!_overflowDrawer && (
                    <span className = 'popover-trigger remote-video-menu-trigger'>
                        {!isMobileBrowser() && <Icon
                            ariaLabel = { this.props.t('dialog.remoteUserControls', { username }) }
                            role = 'button'
                            size = '1.4em'
                            src = { IconMenuThumb }
                            tabIndex = { 0 }
                            title = { this.props.t('dialog.remoteUserControls', { username }) } />
                        }
                    </span>
                )}
            </Popover>
        );
    }

    _onPopoverOpen: () => void;

    /**
     * Disable and hide toolbox while context menu is open.
     *
     * @returns {void}
     */
    _onPopoverOpen() {
        const { dispatch, showPopover } = this.props;

        showPopover();
        dispatch(setParticipantContextMenuOpen(true));
    }

    _onPopoverClose: () => void;

    /**
     * Render normal context menu next time popover dialog opens.
     *
     * @returns {void}
     */
    _onPopoverClose() {
        const { dispatch, hidePopover } = this.props;

        hidePopover();
        batch(() => {
            dispatch(setParticipantContextMenuOpen(false));
            dispatch(renderConnectionStatus(false));
        });
    }

    /**
     * Creates a new {@code VideoMenu} with buttons for interacting with
     * the remote participant.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderRemoteVideoMenu() {
        const {
            _disableKick,
            _disableRemoteMute,
            _disableGrantModerator,
            _isModerator,
            dispatch,
            initialVolumeValue,
            onVolumeChange,
            _remoteControlState,
            participantID
        } = this.props;

        const actions = [];
        const buttons = [];
        const showVolumeSlider = !isIosMobileBrowser()
              && onVolumeChange
              && typeof initialVolumeValue === 'number'
              && !isNaN(initialVolumeValue);

        if (_isModerator) {
            if (!_disableRemoteMute) {
                buttons.push(
                    <MuteButton
                        key = 'mute'
                        participantID = { participantID } />
                );
                buttons.push(
                    <MuteEveryoneElseButton
                        key = 'mute-others'
                        participantID = { participantID } />
                );
                buttons.push(
                    <MuteVideoButton
                        key = 'mute-video'
                        participantID = { participantID } />
                );
                buttons.push(
                    <MuteEveryoneElsesVideoButton
                        key = 'mute-others-video'
                        participantID = { participantID } />
                );
            }

            if (!_disableGrantModerator) {
                buttons.push(
                    <GrantModeratorButton
                        key = 'grant-moderator'
                        participantID = { participantID } />
                );
            }

            if (!_disableKick) {
                buttons.push(
                    <KickButton
                        key = 'kick'
                        participantID = { participantID } />
                );
            }
        }

        if (_remoteControlState) {
            let onRemoteControlToggle = null;

            if (_remoteControlState === REMOTE_CONTROL_MENU_STATES.STARTED) {
                onRemoteControlToggle = () => dispatch(stopController(true));
            } else if (_remoteControlState === REMOTE_CONTROL_MENU_STATES.NOT_STARTED) {
                onRemoteControlToggle = () => dispatch(requestRemoteControl(participantID));
            }

            buttons.push(
                <RemoteControlButton
                    key = 'remote-control'
                    onClick = { onRemoteControlToggle }
                    participantID = { participantID }
                    remoteControlState = { _remoteControlState } />
            );
        }

        buttons.push(
            <PrivateMessageMenuButton
                key = 'privateMessage'
                participantID = { participantID } />
        );

        if (isMobileBrowser()) {
            actions.push(
                <ConnectionStatusButton
                    key = 'conn-status'
                    participantId = { participantID } />
            );
        }

        if (showVolumeSlider) {
            actions.push(
                <VolumeSlider
                    initialValue = { initialVolumeValue }
                    key = 'volume-slider'
                    onChange = { onVolumeChange } />
            );
        }

        if (buttons.length > 0 || actions.length > 0) {
            return (
                <VideoMenu id = { participantID }>
                    <>
                        { buttons.length > 0
                          && <li onClick = { this.props.hidePopover }>
                              <ul className = 'popupmenu__list'>
                                  { buttons }
                              </ul>
                          </li>
                        }
                    </>
                    <>
                        { actions.length > 0
                         && <li>
                             <ul className = 'popupmenu__list'>
                                 {actions}
                             </ul>
                         </li>
                        }
                    </>
                </VideoMenu>
            );
        }

        return null;
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code RemoteVideoMenuTriggerButton}'s props.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state, ownProps) {
    const { participantID } = ownProps;
    const localParticipant = getLocalParticipant(state);
    const { remoteVideoMenu = {}, disableRemoteMute } = state['features/base/config'];
    const { disableKick, disableGrantModerator } = remoteVideoMenu;
    let _remoteControlState = null;
    const participant = getParticipantById(state, participantID);
    const _participantDisplayName = participant?.name;
    const _isRemoteControlSessionActive = participant?.remoteControlSessionStatus ?? false;
    const _supportsRemoteControl = participant?.supportsRemoteControl ?? false;
    const { active, controller } = state['features/remote-control'];
    const { requestedParticipant, controlled } = controller;
    const activeParticipant = requestedParticipant || controlled;
    const { overflowDrawer } = state['features/toolbox'];
    const { showConnectionInfo } = state['features/base/connection'];

    if (_supportsRemoteControl
            && ((!active && !_isRemoteControlSessionActive) || activeParticipant === participantID)) {
        if (requestedParticipant === participantID) {
            _remoteControlState = REMOTE_CONTROL_MENU_STATES.REQUESTING;
        } else if (controlled) {
            _remoteControlState = REMOTE_CONTROL_MENU_STATES.STARTED;
        } else {
            _remoteControlState = REMOTE_CONTROL_MENU_STATES.NOT_STARTED;
        }
    }

    const currentLayout = getCurrentLayout(state);
    let _menuPosition;

    switch (currentLayout) {
    case LAYOUTS.TILE_VIEW:
        _menuPosition = 'left-start';
        break;
    case LAYOUTS.VERTICAL_FILMSTRIP_VIEW:
        _menuPosition = 'left-end';
        break;
    case LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW:
        _menuPosition = 'top';
        break;
    default:
        _menuPosition = 'auto';
    }

    return {
        _isModerator: Boolean(localParticipant?.role === PARTICIPANT_ROLE.MODERATOR),
        _disableKick: Boolean(disableKick),
        _disableRemoteMute: Boolean(disableRemoteMute),
        _remoteControlState,
        _menuPosition,
        _overflowDrawer: overflowDrawer,
        _participantDisplayName,
        _disableGrantModerator: Boolean(disableGrantModerator),
        _showConnectionInfo: showConnectionInfo
    };
}

export default translate(connect(_mapStateToProps)(RemoteVideoMenuTriggerButton));
/* eslint-enable react/jsx-handler-names */
