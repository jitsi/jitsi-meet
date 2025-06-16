import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { batch, connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState, IStore } from '../../../app/types';
import { isMobileBrowser } from '../../../base/environment/utils';
import { IconDotsHorizontal } from '../../../base/icons/svg';
import { getLocalParticipant, getParticipantById } from '../../../base/participants/functions';
import { IParticipant } from '../../../base/participants/types';
import Popover from '../../../base/popover/components/Popover.web';
import { setParticipantContextMenuOpen } from '../../../base/responsive-ui/actions';
import Button from '../../../base/ui/components/web/Button';
import ConnectionIndicatorContent from
    '../../../connection-indicator/components/web/ConnectionIndicatorContent';
import { THUMBNAIL_TYPE } from '../../../filmstrip/constants';
import { renderConnectionStatus } from '../../actions.web';

import FakeParticipantContextMenu from './FakeParticipantContextMenu';
import ParticipantContextMenu from './ParticipantContextMenu';
import { REMOTE_CONTROL_MENU_STATES } from './RemoteControlButton';

/**
 * The type of the React {@code Component} props of
 * {@link RemoteVideoMenuTriggerButton}.
 */
interface IProps {

    /**
     * Whether the remote video context menu is disabled.
     */
    _disabled: Boolean;

    /**
     * Shared video local participant owner.
     */
    _localVideoOwner?: boolean;

    /**
     * The position relative to the trigger the remote menu should display
     * from.
     */
    _menuPosition: string;

    /**
     * Participant reference.
     */
    _participant: IParticipant;

    /**
     * The ID for the participant on which the remote video menu will act.
     */
    _participantDisplayName: string;

    /**
     * The current state of the participant's remote control session.
     */
    _remoteControlState?: number;

    /**
     * Whether the popover should render the Connection Info stats.
     */
    _showConnectionInfo: Boolean;

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
     * The ID for the participant on which the remote video menu will act.
     */
    participantID: string;

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
            marginRight: '4px',
            marginBottom: '4px'
        }
    };
});

const RemoteVideoMenuTriggerButton = ({
    _disabled,
    _localVideoOwner,
    _menuPosition,
    _participant,
    _participantDisplayName,
    _remoteControlState,
    _showConnectionInfo,
    buttonVisible,
    dispatch,
    hidePopover,
    participantID,
    popoverVisible,
    showPopover
}: IProps) => {
    const { classes } = useStyles();
    const { t } = useTranslation();

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

    // eslint-disable-next-line react/no-multi-comp
    const _renderRemoteVideoMenu = () => {
        const props = {
            className: classes.contextMenu,
            onSelect: _onPopoverClose,
            participant: _participant,
            thumbnailMenu: true
        };

        if (_participant?.fakeParticipant) {
            return (
                <FakeParticipantContextMenu
                    { ...props }
                    localVideoOwner = { _localVideoOwner } />
            );
        }

        return (
            <ParticipantContextMenu
                { ...props }
                remoteControlState = { _remoteControlState } />
        );
    };

    let content;

    if (_showConnectionInfo) {
        content = <ConnectionIndicatorContent participantId = { participantID } />;
    } else if (!_disabled) {
        content = _renderRemoteVideoMenu();
    }

    if (!content) {
        return null;
    }

    const username = _participantDisplayName;

    return (
        <Popover
            content = { content }
            headingLabel = { t('dialog.remoteUserControls', { username }) }
            id = 'remote-video-menu-trigger'
            onPopoverClose = { _onPopoverClose }
            onPopoverOpen = { _onPopoverOpen }
            position = { _menuPosition }
            visible = { Boolean(popoverVisible) }>
            {buttonVisible && !_disabled && (
                !isMobileBrowser() && <Button
                    accessibilityLabel = { t('dialog.remoteUserControls', { username }) }
                    className = { classes.triggerButton }
                    icon = { IconDotsHorizontal }
                    size = 'small' />
            )}
        </Popover>
    );
};

/**
 * Maps (parts of) the Redux state to the associated {@code RemoteVideoMenuTriggerButton}'s props.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState, ownProps: Partial<IProps>) {
    const { participantID, thumbnailType } = ownProps;
    let _remoteControlState;
    const localParticipantId = getLocalParticipant(state)?.id;
    const participant = getParticipantById(state, participantID ?? '');
    const _participantDisplayName = participant?.name;
    const _isRemoteControlSessionActive = participant?.remoteControlSessionStatus ?? false;
    const _supportsRemoteControl = participant?.supportsRemoteControl ?? false;
    const { active, controller } = state['features/remote-control'];
    const { requestedParticipant, controlled } = controller;
    const activeParticipant = requestedParticipant || controlled;
    const { showConnectionInfo } = state['features/base/connection'];
    const { remoteVideoMenu } = state['features/base/config'];
    const { ownerId } = state['features/shared-video'];

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

    switch (thumbnailType) {
    case THUMBNAIL_TYPE.TILE:
        _menuPosition = 'left-start';
        break;
    case THUMBNAIL_TYPE.VERTICAL:
        _menuPosition = 'left-end';
        break;
    case THUMBNAIL_TYPE.HORIZONTAL:
        _menuPosition = 'top';
        break;
    default:
        _menuPosition = 'auto';
    }

    return {
        _disabled: Boolean(remoteVideoMenu?.disabled),
        _localVideoOwner: Boolean(ownerId === localParticipantId),
        _menuPosition,
        _participant: participant ?? { id: '' },
        _participantDisplayName: _participantDisplayName ?? '',
        _remoteControlState,
        _showConnectionInfo: Boolean(showConnectionInfo)
    };
}

export default connect(_mapStateToProps)(RemoteVideoMenuTriggerButton);
