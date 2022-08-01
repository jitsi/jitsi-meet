/* eslint-disable lines-around-comment */
import { withStyles } from '@material-ui/styles';
import React, { Component } from 'react';
import { batch, connect } from 'react-redux';

// @ts-ignore
import ContextMenu from '../../../base/components/context-menu/ContextMenu';
// @ts-ignore
import ContextMenuItemGroup from '../../../base/components/context-menu/ContextMenuItemGroup';
// @ts-ignore
import { isMobileBrowser } from '../../../base/environment/utils';
// @ts-ignore
import { translate } from '../../../base/i18n';
import { IconHorizontalPoints } from '../../../base/icons/svg/index';
import {
    getLocalParticipant
    // @ts-ignore
} from '../../../base/participants';
// @ts-ignore
import { Popover } from '../../../base/popover';
// @ts-ignore
import { setParticipantContextMenuOpen } from '../../../base/responsive-ui/actions';
// @ts-ignore
import { getHideSelfView } from '../../../base/settings';
// @ts-ignore
import { getLocalVideoTrack } from '../../../base/tracks';
import Button from '../../../base/ui/components/web/Button';
// @ts-ignore
import ConnectionIndicatorContent from '../../../connection-indicator/components/web/ConnectionIndicatorContent';
// @ts-ignore
import { THUMBNAIL_TYPE } from '../../../filmstrip';
// @ts-ignore
import { isStageFilmstripAvailable } from '../../../filmstrip/functions.web';
// @ts-ignore
import { renderConnectionStatus } from '../../actions.web';

// @ts-ignore
import ConnectionStatusButton from './ConnectionStatusButton';
// @ts-ignore
import FlipLocalVideoButton from './FlipLocalVideoButton';
// @ts-ignore
import HideSelfViewVideoButton from './HideSelfViewVideoButton';
// @ts-ignore
import TogglePinToStageButton from './TogglePinToStageButton';

/**
 * The type of the React {@code Component} props of
 * {@link LocalVideoMenuTriggerButton}.
 */
type Props = {

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
     * Whether or not the button should be visible.
     */
    buttonVisible: boolean,

    /**
     * An object containing the CSS classes.
     */
    classes: any,

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
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * The type of the thumbnail.
     */
    thumbnailType: string
};

const styles = () => {
    return {
        triggerButton: {
            padding: '3px !important',
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
                    {!_overflowDrawer && buttonVisible && !isMobileBrowser() && (
                        <Button
                            accessibilityLabel = { t('dialog.localUserControls') }
                            className = { classes.triggerButton }
                            icon = { IconHorizontalPoints }
                            size = 'small' />
                    )}
                </Popover>
                : null
        );
    }

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
function _mapStateToProps(state: any, ownProps: Partial<Props>) {
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
        _showPinToStage: isStageFilmstripAvailable(state)
    };
}

// @ts-ignore
export default translate(connect(_mapStateToProps)(withStyles(styles)(LocalVideoMenuTriggerButton)));
