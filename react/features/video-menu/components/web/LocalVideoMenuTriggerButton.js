// @flow

import { withStyles } from '@material-ui/styles';
import React, { Component } from 'react';
import { batch } from 'react-redux';

import ContextMenu from '../../../base/components/context-menu/ContextMenu';
import ContextMenuItemGroup from '../../../base/components/context-menu/ContextMenuItemGroup';
import { isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n';
import { Icon, IconHorizontalPoints } from '../../../base/icons';
import {
    getLocalParticipant
} from '../../../base/participants';
import { Popover } from '../../../base/popover';
import { connect } from '../../../base/redux';
import { setParticipantContextMenuOpen } from '../../../base/responsive-ui/actions';
import { getHideSelfView } from '../../../base/settings';
import { getLocalVideoTrack } from '../../../base/tracks';
import ConnectionIndicatorContent from '../../../connection-indicator/components/web/ConnectionIndicatorContent';
import { THUMBNAIL_TYPE } from '../../../filmstrip';
import { isStageFilmstripEnabled } from '../../../filmstrip/functions.web';
import { renderConnectionStatus } from '../../actions.web';

import ConnectionStatusButton from './ConnectionStatusButton';
import FlipLocalVideoButton from './FlipLocalVideoButton';
import HideSelfViewVideoButton from './HideSelfViewVideoButton';
import TogglePinToStageButton from './TogglePinToStageButton';

/**
 * The type of the React {@code Component} props of
 * {@link LocalVideoMenuTriggerButton}.
 */
type Props = {

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
     * The id of the local participant.
     */
    _localParticipantId: string,

    /**
     * The position relative to the trigger the local video menu should display
     * from. Valid values are those supported by AtlasKit
     * {@code InlineDialog}.
     */
    _menuPosition: string,

    /**
     * Whether to display the Popover as a drawer.
     */
    _overflowDrawer: boolean,

    /**
     * Whether to render the connection info pane.
     */
    _showConnectionInfo: boolean,

    /**
     * Whether to render the hide self view button.
     */
    _showHideSelfViewButton: boolean,

    /**
     * Shows/hides the local video flip button.
     */
    _showLocalVideoFlipButton: boolean,

    /**
     * Whether to render the pin to stage button.
     */
    _showPinToStage: boolean,

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
            minWidth: '200px'
        },

        flipText: {
            marginLeft: '36px'
        }
    };
};

/**
 * React Component for displaying an icon associated with opening the
 * the video menu for the local participant.
 *
 * @augments {Component}
 */
class LocalVideoMenuTriggerButton extends Component<Props> {

    /**
     * Initializes a new LocalVideoMenuTriggerButton instance.
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
            _localParticipantId,
            _menuPosition,
            _overflowDrawer,
            _showConnectionInfo,
            _showHideSelfViewButton,
            _showLocalVideoFlipButton,
            _showPinToStage,
            buttonVisible,
            classes,
            hidePopover,
            popoverVisible,
            t
        } = this.props;

        const content = _showConnectionInfo
            ? <ConnectionIndicatorContent participantId = { _localParticipantId } />
            : (
                <ContextMenu
                    className = { classes.contextMenu }
                    hidden = { false }
                    inDrawer = { _overflowDrawer }>
                    <ContextMenuItemGroup>
                        { _showLocalVideoFlipButton
                            && <FlipLocalVideoButton
                                className = { _overflowDrawer ? classes.flipText : '' }
                                onClick = { hidePopover } />
                        }
                        { _showHideSelfViewButton
                            && <HideSelfViewVideoButton
                                className = { _overflowDrawer ? classes.flipText : '' }
                                onClick = { hidePopover } />
                        }
                        {
                            _showPinToStage && <TogglePinToStageButton
                                className = { _overflowDrawer ? classes.flipText : '' }
                                noIcon = { true }
                                onClick = { hidePopover }
                                participantID = { _localParticipantId } />
                        }
                        { isMobileBrowser()
                            && <ConnectionStatusButton participantId = { _localParticipantId } />
                        }
                    </ContextMenuItemGroup>
                </ContextMenu>
            );

        return (
            isMobileBrowser() || _showLocalVideoFlipButton || _showHideSelfViewButton
                ? <Popover
                    content = { content }
                    id = 'local-video-menu-trigger'
                    onPopoverClose = { this._onPopoverClose }
                    onPopoverOpen = { this._onPopoverOpen }
                    overflowDrawer = { _overflowDrawer }
                    position = { _menuPosition }
                    visible = { popoverVisible }>
                    {!_overflowDrawer && buttonVisible && (
                        <span
                            className = { classes.triggerButton }
                            role = 'button'>
                            {!isMobileBrowser() && <Icon
                                ariaLabel = { t('dialog.localUserControls') }
                                size = { 18 }
                                src = { IconHorizontalPoints }
                                tabIndex = { 0 }
                                title = { t('dialog.localUserControls') } />
                            }
                        </span>
                    )}
                </Popover>
                : null
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
        const { hidePopover, dispatch } = this.props;

        hidePopover();
        batch(() => {
            dispatch(setParticipantContextMenuOpen(false));
            dispatch(renderConnectionStatus(false));
        });
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code LocalVideoMenuTriggerButton}'s props.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state, ownProps) {
    const { thumbnailType } = ownProps;
    const localParticipant = getLocalParticipant(state);
    const { disableLocalVideoFlip, disableSelfViewSettings } = state['features/base/config'];
    const videoTrack = getLocalVideoTrack(state['features/base/tracks']);
    const { overflowDrawer } = state['features/toolbox'];
    const { showConnectionInfo } = state['features/base/connection'];
    const showHideSelfViewButton = !disableSelfViewSettings && !getHideSelfView(state);

    let _menuPosition;

    switch (thumbnailType) {
    case THUMBNAIL_TYPE.TILE:
        _menuPosition = 'left-start';
        break;
    case THUMBNAIL_TYPE.VERTICAL:
        _menuPosition = 'left-start';
        break;
    case THUMBNAIL_TYPE.HORIZONTAL:
        _menuPosition = 'top-start';
        break;
    default:
        _menuPosition = 'auto';
    }

    return {
        _menuPosition,
        _showLocalVideoFlipButton: !disableLocalVideoFlip && videoTrack?.videoType !== 'desktop',
        _showHideSelfViewButton: showHideSelfViewButton,
        _overflowDrawer: overflowDrawer,
        _localParticipantId: localParticipant.id,
        _showConnectionInfo: showConnectionInfo,
        _showPinToStage: isStageFilmstripEnabled(state)
    };
}

export default translate(connect(_mapStateToProps)(withStyles(styles)(LocalVideoMenuTriggerButton)));
