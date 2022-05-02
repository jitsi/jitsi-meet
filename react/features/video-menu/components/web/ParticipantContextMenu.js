// @flow

import { makeStyles } from '@material-ui/styles';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { isSupported as isAvModerationSupported } from '../../../av-moderation/functions';
import { Avatar } from '../../../base/avatar';
import ContextMenu from '../../../base/components/context-menu/ContextMenu';
import ContextMenuItemGroup from '../../../base/components/context-menu/ContextMenuItemGroup';
import { isIosMobileBrowser, isMobileBrowser } from '../../../base/environment/utils';
import { IconShareVideo } from '../../../base/icons';
import { MEDIA_TYPE } from '../../../base/media';
import { getLocalParticipant, PARTICIPANT_ROLE } from '../../../base/participants';
import { isParticipantAudioMuted } from '../../../base/tracks';
import { getBreakoutRooms, getCurrentRoomId, isInBreakoutRoom } from '../../../breakout-rooms/functions';
import { setVolume } from '../../../filmstrip/actions.web';
import { isStageFilmstripEnabled } from '../../../filmstrip/functions.web';
import { isForceMuted } from '../../../participants-pane/functions';
import { requestRemoteControl, stopController } from '../../../remote-control';
import { stopSharedVideo } from '../../../shared-video/actions.any';
import { showOverflowDrawer } from '../../../toolbox/functions.web';

import { REMOTE_CONTROL_MENU_STATES } from './RemoteControlButton';
import SendToRoomButton from './SendToRoomButton';

import {
    AskToUnmuteButton,
    ConnectionStatusButton,
    GrantModeratorButton,
    MuteButton,
    MuteEveryoneElseButton,
    MuteEveryoneElsesVideoButton,
    MuteVideoButton,
    KickButton,
    PrivateMessageMenuButton,
    RemoteControlButton,
    TogglePinToStageButton,
    VolumeSlider
} from './';

type Props = {

    /**
     * Class name for the context menu.
     */
    className?: string,

    /**
     * Closes a drawer if open.
     */
    closeDrawer?: Function,

    /**
     * The participant for which the drawer is open.
     * It contains the displayName & participantID.
     */
    drawerParticipant?: Object,

    /**
     * Shared video local participant owner.
     */
    localVideoOwner?: boolean,

    /**
     * Target elements against which positioning calculations are made.
     */
    offsetTarget?: HTMLElement,

    /**
     * Callback for the mouse entering the component.
     */
    onEnter?: Function,

    /**
     * Callback for the mouse leaving the component.
     */
    onLeave?: Function,

    /**
     * Callback for making a selection in the menu.
     */
    onSelect: Function,

    /**
     * Participant reference.
     */
    participant: Object,

    /**
     * The current state of the participant's remote control session.
     */
    remoteControlState?: number,

    /**
     * Whether or not the menu is displayed in the thumbnail remote video menu.
     */
    thumbnailMenu: ?boolean
}

const useStyles = makeStyles(theme => {
    return {
        text: {
            color: theme.palette.text02,
            padding: '10px 16px',
            height: '40px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            boxSizing: 'border-box'
        }
    };
});

const ParticipantContextMenu = ({
    className,
    closeDrawer,
    drawerParticipant,
    localVideoOwner,
    offsetTarget,
    onEnter,
    onLeave,
    onSelect,
    participant,
    remoteControlState,
    thumbnailMenu
}: Props) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const styles = useStyles();

    const localParticipant = useSelector(getLocalParticipant);
    const _isModerator = Boolean(localParticipant?.role === PARTICIPANT_ROLE.MODERATOR);
    const _isAudioForceMuted = useSelector(state =>
        isForceMuted(participant, MEDIA_TYPE.AUDIO, state));
    const _isVideoForceMuted = useSelector(state =>
        isForceMuted(participant, MEDIA_TYPE.VIDEO, state));
    const _isAudioMuted = useSelector(state => isParticipantAudioMuted(participant, state));
    const _overflowDrawer = useSelector(showOverflowDrawer);
    const { remoteVideoMenu = {}, disableRemoteMute, startSilent }
        = useSelector(state => state['features/base/config']);
    const { disableKick, disableGrantModerator, disablePrivateChat } = remoteVideoMenu;
    const { participantsVolume } = useSelector(state => state['features/filmstrip']);
    const _volume = (participant?.local ?? true ? undefined
        : participant?.id ? participantsVolume[participant?.id] : undefined) ?? 1;
    const isBreakoutRoom = useSelector(isInBreakoutRoom);
    const isModerationSupported = useSelector(isAvModerationSupported());
    const stageFilmstrip = useSelector(isStageFilmstripEnabled);

    const _currentRoomId = useSelector(getCurrentRoomId);
    const _rooms = Object.values(useSelector(getBreakoutRooms));

    const _onVolumeChange = useCallback(value => {
        dispatch(setVolume(participant.id, value));
    }, [ setVolume, dispatch ]);

    const clickHandler = useCallback(() => onSelect(true), [ onSelect ]);

    const _onStopSharedVideo = useCallback(() => {
        clickHandler();
        dispatch(stopSharedVideo());
    }, [ stopSharedVideo ]);

    const _getCurrentParticipantId = useCallback(() => {
        const drawer = _overflowDrawer && !thumbnailMenu;

        return (drawer ? drawerParticipant?.participantID : participant?.id) ?? '';
    }
    , [ thumbnailMenu, _overflowDrawer, drawerParticipant, participant ]);

    const buttons = [];
    const buttons2 = [];

    const showVolumeSlider = !startSilent
        && !isIosMobileBrowser()
        && (_overflowDrawer || thumbnailMenu)
        && typeof _volume === 'number'
        && !isNaN(_volume);

    const fakeParticipantActions = [ {
        accessibilityLabel: t('toolbar.stopSharedVideo'),
        icon: IconShareVideo,
        onClick: _onStopSharedVideo,
        text: t('toolbar.stopSharedVideo')
    } ];

    if (_isModerator) {
        if ((thumbnailMenu || _overflowDrawer) && isModerationSupported && _isAudioMuted) {
            buttons.push(<AskToUnmuteButton
                isAudioForceMuted = { _isAudioForceMuted }
                isVideoForceMuted = { _isVideoForceMuted }
                key = 'ask-unmute'
                participantID = { _getCurrentParticipantId() } />
            );
        }
        if (!disableRemoteMute) {
            buttons.push(
                <MuteButton
                    key = 'mute'
                    participantID = { _getCurrentParticipantId() } />
            );
            buttons.push(
                <MuteEveryoneElseButton
                    key = 'mute-others'
                    participantID = { _getCurrentParticipantId() } />
            );
            buttons.push(
                <MuteVideoButton
                    key = 'mute-video'
                    participantID = { _getCurrentParticipantId() } />
            );
            buttons.push(
                <MuteEveryoneElsesVideoButton
                    key = 'mute-others-video'
                    participantID = { _getCurrentParticipantId() } />
            );
        }

        if (!disableGrantModerator && !isBreakoutRoom) {
            buttons2.push(
                <GrantModeratorButton
                    key = 'grant-moderator'
                    participantID = { _getCurrentParticipantId() } />
            );
        }

        if (!disableKick) {
            buttons2.push(
                <KickButton
                    key = 'kick'
                    participantID = { _getCurrentParticipantId() } />
            );
        }
    }

    if (stageFilmstrip) {
        buttons2.push(<TogglePinToStageButton
            key = 'pinToStage'
            participantID = { _getCurrentParticipantId() } />);
    }

    if (!disablePrivateChat) {
        buttons2.push(<PrivateMessageMenuButton
            key = 'privateMessage'
            participantID = { _getCurrentParticipantId() } />
        );
    }

    if (thumbnailMenu && isMobileBrowser()) {
        buttons2.push(
            <ConnectionStatusButton
                key = 'conn-status'
                participantId = { _getCurrentParticipantId() } />
        );
    }

    if (thumbnailMenu && remoteControlState) {
        let onRemoteControlToggle = null;

        if (remoteControlState === REMOTE_CONTROL_MENU_STATES.STARTED) {
            onRemoteControlToggle = () => dispatch(stopController(true));
        } else if (remoteControlState === REMOTE_CONTROL_MENU_STATES.NOT_STARTED) {
            onRemoteControlToggle = () => dispatch(requestRemoteControl(_getCurrentParticipantId()));
        }

        buttons2.push(
            <RemoteControlButton
                key = 'remote-control'
                onClick = { onRemoteControlToggle }
                participantID = { _getCurrentParticipantId() }
                remoteControlState = { remoteControlState } />
        );
    }

    const breakoutRoomsButtons = [];

    if (!thumbnailMenu && _isModerator) {
        _rooms.forEach((room: Object) => {
            if (room.id !== _currentRoomId) {
                breakoutRoomsButtons.push(
                    <SendToRoomButton
                        key = { room.id }
                        onClick = { clickHandler }
                        participantID = { _getCurrentParticipantId() }
                        room = { room } />
                );
            }
        });
    }

    return (
        <ContextMenu
            className = { className }
            entity = { participant }
            hidden = { thumbnailMenu ? false : undefined }
            inDrawer = { thumbnailMenu && _overflowDrawer }
            isDrawerOpen = { drawerParticipant }
            offsetTarget = { offsetTarget }
            onClick = { onSelect }
            onDrawerClose = { thumbnailMenu ? onSelect : closeDrawer }
            onMouseEnter = { onEnter }
            onMouseLeave = { onLeave }>
            {!thumbnailMenu && _overflowDrawer && drawerParticipant && <ContextMenuItemGroup
                actions = { [ {
                    accessibilityLabel: drawerParticipant.displayName,
                    customIcon: <Avatar
                        participantId = { drawerParticipant.participantID }
                        size = { 20 } />,
                    text: drawerParticipant.displayName
                } ] } />}
            {participant?.isFakeParticipant ? localVideoOwner && (
                <ContextMenuItemGroup
                    actions = { fakeParticipantActions } />
            ) : (
                <>
                    {buttons.length > 0 && (
                        <ContextMenuItemGroup>
                            {buttons}
                        </ContextMenuItemGroup>
                    )}
                    <ContextMenuItemGroup>
                        {buttons2}
                    </ContextMenuItemGroup>
                    {showVolumeSlider && (
                        <ContextMenuItemGroup>
                            <VolumeSlider
                                initialValue = { _volume }
                                key = 'volume-slider'
                                onChange = { _onVolumeChange } />
                        </ContextMenuItemGroup>
                    )}
                    {breakoutRoomsButtons.length > 0 && (
                        <ContextMenuItemGroup>
                            <div className = { styles.text }>
                                {t('breakoutRooms.actions.sendToBreakoutRoom')}
                            </div>
                            {breakoutRoomsButtons}
                        </ContextMenuItemGroup>
                    )}
                </>
            )}
        </ContextMenu>
    );
};

export default ParticipantContextMenu;
