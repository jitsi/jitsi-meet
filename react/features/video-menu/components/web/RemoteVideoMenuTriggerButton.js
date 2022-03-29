// @flow

/* eslint-disable react/jsx-handler-names */
import { withStyles } from '@material-ui/styles';
import React, { Component } from 'react';
import { batch } from 'react-redux';

import ConnectionIndicatorContent from
    '../../../../features/connection-indicator/components/web/ConnectionIndicatorContent';
import { isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n';
import { Icon, IconHorizontalPoints } from '../../../base/icons';
import { getParticipantById } from '../../../base/participants';
import { Popover } from '../../../base/popover';
import { connect } from '../../../base/redux';
import { setParticipantContextMenuOpen } from '../../../base/responsive-ui/actions';
import { LAYOUTS } from '../../../video-layout';
import { renderConnectionStatus } from '../../actions.web';

import ParticipantContextMenu from './ParticipantContextMenu';
import { REMOTE_CONTROL_MENU_STATES } from './RemoteControlButton';


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
     * Participant reference.
     */
    _participant: Object,

    /**
     * The current state of the participant's remote control session.
     */
    _remoteControlState: number,

    /**
     * Whether or not the button should be visible.
     */
    buttonVisible: boolean,

    /**
     * An object containing the CSS classes.
     */
    classes: Object,

    /**
     * The redux dispatch function.
     */
    dispatch: Function,

    /**
     * The ID for the participant on which the remote video menu will act.
     */
    participantID: string,

    /**
     * Whether the remote video context menu is disabled.
     */
    _disabled: Boolean,

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

const styles = theme => {
    return {
        triggerButton: {
            backgroundColor: theme.palette.action01,
            padding: '3px',
            display: 'inline-block',
            borderRadius: '4px'
        },

        contextMenu: {
            position: 'relative',
            marginTop: 0,
            right: 'auto',
            padding: '0',
            marginRight: '4px',
            marginBottom: '4px'
        }
    };
};

/**
 * React {@code Component} for displaying an icon associated with opening the
 * the {@code VideoMenu}.
 *
 * @augments {Component}
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
            _disabled,
            _overflowDrawer,
            _showConnectionInfo,
            _participantDisplayName,
            buttonVisible,
            classes,
            participantID,
            popoverVisible
        } = this.props;
        let content;

        if (_showConnectionInfo) {
            content = <ConnectionIndicatorContent participantId = { participantID } />;
        } else if (!_disabled) {
            content = this._renderRemoteVideoMenu();
        }

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
                {!_overflowDrawer && buttonVisible && !_disabled && (
                    <span
                        className = { classes.triggerButton }
                        role = 'button'>
                        {!isMobileBrowser() && <Icon
                            ariaLabel = { this.props.t('dialog.remoteUserControls', { username }) }
                            size = { 18 }
                            src = { IconHorizontalPoints }
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
        const { _participant, _remoteControlState, classes } = this.props;

        return (
            <ParticipantContextMenu
                className = { classes.contextMenu }
                onSelect = { this._onPopoverClose }
                participant = { _participant }
                remoteControlState = { _remoteControlState }
                thumbnailMenu = { true } />
        );
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
    const { participantID, currentLayout } = ownProps;
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
    const { remoteVideoMenu } = state['features/base/config'];

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
        _disabled: remoteVideoMenu?.disabled,
        _menuPosition,
        _overflowDrawer: overflowDrawer,
        _participant: participant,
        _participantDisplayName,
        _remoteControlState,
        _showConnectionInfo: showConnectionInfo
    };
}

export default translate(connect(_mapStateToProps)(
    withStyles(styles)(RemoteVideoMenuTriggerButton)));
