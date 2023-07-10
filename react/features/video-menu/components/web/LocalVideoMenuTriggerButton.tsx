import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { batch, connect, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState, IStore } from '../../../app/types';
import { getButtonNotifyMode, getParticipantMenuButtonsWithNotifyClick } from '../../../base/config/functions.web';
import { isMobileBrowser } from '../../../base/environment/utils';
import { IconDotsHorizontal } from '../../../base/icons/svg';
import { getLocalParticipant } from '../../../base/participants/functions';
import Popover from '../../../base/popover/components/Popover.web';
import { setParticipantContextMenuOpen } from '../../../base/responsive-ui/actions';
import { getHideSelfView } from '../../../base/settings/functions.web';
import { getLocalVideoTrack } from '../../../base/tracks/functions';
import Button from '../../../base/ui/components/web/Button';
import ContextMenu from '../../../base/ui/components/web/ContextMenu';
import ContextMenuItemGroup from '../../../base/ui/components/web/ContextMenuItemGroup';
import ConnectionIndicatorContent from '../../../connection-indicator/components/web/ConnectionIndicatorContent';
import { THUMBNAIL_TYPE } from '../../../filmstrip/constants';
import { isStageFilmstripAvailable } from '../../../filmstrip/functions.web';
import { NOTIFY_CLICK_MODE } from '../../../toolbox/constants';
import { renderConnectionStatus } from '../../actions.web';
import { PARTICIPANT_MENU_BUTTONS as BUTTONS } from '../../constants';

import ConnectionStatusButton from './ConnectionStatusButton';
import FlipLocalVideoButton from './FlipLocalVideoButton';
import HideSelfViewVideoButton from './HideSelfViewVideoButton';
import TogglePinToStageButton from './TogglePinToStageButton';

/**
 * The type of the React {@code Component} props of
 * {@link LocalVideoMenuTriggerButton}.
 */
interface IProps {

    /**
     * The id of the local participant.
     */
    _localParticipantId: string;

    /**
     * The position relative to the trigger the local video menu should display
     * from.
     */
    _menuPosition: string;

    /**
     * Whether to display the Popover as a drawer.
     */
    _overflowDrawer: boolean;

    /**
     * Whether to render the connection info pane.
     */
    _showConnectionInfo: boolean;

    /**
     * Whether to render the hide self view button.
     */
    _showHideSelfViewButton: boolean;

    /**
     * Shows/hides the local video flip button.
     */
    _showLocalVideoFlipButton: boolean;

    /**
     * Whether to render the pin to stage button.
     */
    _showPinToStage: boolean;

    /**
     * Whether or not the button should be visible.
     */
    buttonVisible: boolean;

    /**
     * The redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * Hides popover.
     */
    hidePopover?: Function;

    /**
     * Whether the popover is visible or not.
     */
    popoverVisible?: boolean;

    /**
     * Shows popover.
     */
    showPopover?: Function;

    /**
     * The type of the thumbnail.
     */
    thumbnailType: string;
}

const useStyles = makeStyles()(() => {
    return {
        triggerButton: {
            padding: '3px !important',
            borderRadius: '4px',

            '& svg': {
                width: '18px',
                height: '18px'
            }
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
});

const LocalVideoMenuTriggerButton = ({
    _localParticipantId,
    _menuPosition,
    _overflowDrawer,
    _showConnectionInfo,
    _showHideSelfViewButton,
    _showLocalVideoFlipButton,
    _showPinToStage,
    buttonVisible,
    dispatch,
    hidePopover,
    showPopover,
    popoverVisible
}: IProps) => {
    const { classes } = useStyles();
    const { t } = useTranslation();
    const buttonsWithNotifyClick = useSelector(getParticipantMenuButtonsWithNotifyClick);

    const notifyClick = useCallback(
        (buttonKey: string) => {
            const notifyMode = getButtonNotifyMode(buttonKey, buttonsWithNotifyClick);

            if (!notifyMode) {
                return;
            }

            APP.API.notifyParticipantMenuButtonClicked(
                buttonKey,
                _localParticipantId,
                notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY
            );
        }, [ buttonsWithNotifyClick, getButtonNotifyMode ]);

    const _onPopoverOpen = useCallback(() => {
        showPopover?.();
        dispatch(setParticipantContextMenuOpen(true));
    }, []);

    const _onPopoverClose = useCallback(() => {
        hidePopover?.();
        batch(() => {
            dispatch(setParticipantContextMenuOpen(false));
            dispatch(renderConnectionStatus(false));
        });
    }, []);

    const content = _showConnectionInfo
        ? <ConnectionIndicatorContent participantId = { _localParticipantId } />
        : (
            <ContextMenu
                className = { classes.contextMenu }
                hidden = { false }
                inDrawer = { _overflowDrawer }>
                <ContextMenuItemGroup>
                    {_showLocalVideoFlipButton
                        && <FlipLocalVideoButton
                            className = { _overflowDrawer ? classes.flipText : '' }
                            // eslint-disable-next-line react/jsx-no-bind
                            notifyClick = { () => notifyClick(BUTTONS.FLIP_LOCAL_VIDEO) }
                            notifyMode = { getButtonNotifyMode(BUTTONS.FLIP_LOCAL_VIDEO, buttonsWithNotifyClick) }
                            onClick = { hidePopover } />
                    }
                    {_showHideSelfViewButton
                        && <HideSelfViewVideoButton
                            className = { _overflowDrawer ? classes.flipText : '' }
                            // eslint-disable-next-line react/jsx-no-bind
                            notifyClick = { () => notifyClick(BUTTONS.HIDE_SELF_VIEW) }
                            notifyMode = { getButtonNotifyMode(BUTTONS.HIDE_SELF_VIEW, buttonsWithNotifyClick) }
                            onClick = { hidePopover } />
                    }
                    {
                        _showPinToStage && <TogglePinToStageButton
                            className = { _overflowDrawer ? classes.flipText : '' }
                            noIcon = { true }
                            // eslint-disable-next-line react/jsx-no-bind
                            notifyClick = { () => notifyClick(BUTTONS.PIN_TO_STAGE) }
                            notifyMode = { getButtonNotifyMode(BUTTONS.PIN_TO_STAGE, buttonsWithNotifyClick) }
                            onClick = { hidePopover }
                            participantID = { _localParticipantId } />
                    }
                    {
                        isMobileBrowser() && <ConnectionStatusButton
                            // eslint-disable-next-line react/jsx-no-bind
                            notifyClick = { () => notifyClick(BUTTONS.CONN_STATUS) }
                            notifyMode = { getButtonNotifyMode(BUTTONS.CONN_STATUS, buttonsWithNotifyClick) }
                            participantID = { _localParticipantId } />
                    }
                </ContextMenuItemGroup>
            </ContextMenu>
        );

    return (
        isMobileBrowser() || _showLocalVideoFlipButton || _showHideSelfViewButton
            ? <Popover
                content = { content }
                headingLabel = { t('dialog.localUserControls') }
                id = 'local-video-menu-trigger'
                onPopoverClose = { _onPopoverClose }
                onPopoverOpen = { _onPopoverOpen }
                position = { _menuPosition }
                visible = { Boolean(popoverVisible) }>
                {buttonVisible && !isMobileBrowser() && (
                    <Button
                        accessibilityLabel = { t('dialog.localUserControls') }
                        className = { classes.triggerButton }
                        icon = { IconDotsHorizontal }
                        size = 'small' />
                )}
            </Popover>
            : null
    );
};

/**
 * Maps (parts of) the Redux state to the associated {@code LocalVideoMenuTriggerButton}'s props.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState, ownProps: Partial<IProps>) {
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
        _localParticipantId: localParticipant?.id ?? '',
        _showConnectionInfo: Boolean(showConnectionInfo),
        _showPinToStage: isStageFilmstripAvailable(state)
    };
}

export default connect(_mapStateToProps)(LocalVideoMenuTriggerButton);
