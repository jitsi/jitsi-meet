// @flow
import React, { Component } from 'react';

import { approveParticipant } from '../../../av-moderation/actions';
import { Avatar } from '../../../base/avatar';
import ContextMenu from '../../../base/components/context-menu/ContextMenu';
import ContextMenuItemGroup from '../../../base/components/context-menu/ContextMenuItemGroup';
import { isToolbarButtonEnabled } from '../../../base/config/functions.web';
import { openDialog } from '../../../base/dialog';
import { isIosMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n';
import {
    IconCloseCircle,
    IconCrown,
    IconMessage,
    IconMicDisabled,
    IconMicrophone,
    IconMuteEveryoneElse,
    IconShareVideo,
    IconVideoOff
} from '../../../base/icons';
import { MEDIA_TYPE } from '../../../base/media';
import {
    getLocalParticipant,
    getParticipantByIdOrUndefined,
    isLocalParticipantModerator,
    isParticipantModerator
} from '../../../base/participants';
import { connect } from '../../../base/redux';
import { isParticipantAudioMuted, isParticipantVideoMuted } from '../../../base/tracks';
import { openChatById } from '../../../chat/actions';
import { setVolume } from '../../../filmstrip/actions.web';
import { GrantModeratorDialog, KickRemoteParticipantDialog, MuteEveryoneDialog } from '../../../video-menu';
import { VolumeSlider } from '../../../video-menu/components/web';
import MuteRemoteParticipantsVideoDialog from '../../../video-menu/components/web/MuteRemoteParticipantsVideoDialog';
import { isForceMuted } from '../../functions';

type Props = {

    /**
     * Whether or not the participant is audio force muted.
     */
    _isAudioForceMuted: boolean,

    /**
     * True if the local participant is moderator and false otherwise.
     */
    _isLocalModerator: boolean,

    /**
     * True if the chat button is enabled and false otherwise.
     */
    _isChatButtonEnabled: boolean,

    /**
     * True if the participant is moderator and false otherwise.
     */
    _isParticipantModerator: boolean,

    /**
     * True if the participant is video muted and false otherwise.
     */
    _isParticipantVideoMuted: boolean,

    /**
     * True if the participant is audio muted and false otherwise.
     */
    _isParticipantAudioMuted: boolean,

    /**
     * Whether or not the participant is video force muted.
     */
    _isVideoForceMuted: boolean,

    /**
     * Shared video local participant owner.
     */
    _localVideoOwner: boolean,

    /**
     * Participant reference.
     */
    _participant: Object,

    /**
     * A value between 0 and 1 indicating the volume of the participant's
     * audio element.
     */
    _volume: ?number,

    /**
     * Closes a drawer if open.
     */
    closeDrawer: Function,

    /**
     * An object containing the CSS classes.
     */
    classes?: {[ key: string]: string},

    /**
     * The dispatch function from redux.
     */
    dispatch: Function,

    /**
     * The participant for which the drawer is open.
     * It contains the displayName & participantID.
     */
    drawerParticipant: Object,

    /**
     * Callback used to open a confirmation dialog for audio muting.
     */
    muteAudio: Function,

    /**
     * Target elements against which positioning calculations are made.
     */
    offsetTarget: HTMLElement,

    /**
     * Callback for the mouse entering the component.
     */
    onEnter: Function,

    /**
     * Callback for the mouse leaving the component.
     */
    onLeave: Function,

    /**
     * Callback for making a selection in the menu.
     */
    onSelect: Function,

    /**
     * The ID of the participant.
     */
    participantID: string,

    /**
     * True if an overflow drawer should be displayed.
     */
    overflowDrawer: boolean,

    /**
     * The translate function.
     */
    t: Function
};

/**
 * Implements the MeetingParticipantContextMenu component.
 */
class MeetingParticipantContextMenu extends Component<Props> {

    /**
     * Creates new instance of MeetingParticipantContextMenu.
     *
     * @param {Props} props - The props.
     */
    constructor(props: Props) {
        super(props);

        this._getCurrentParticipantId = this._getCurrentParticipantId.bind(this);
        this._onGrantModerator = this._onGrantModerator.bind(this);
        this._onKick = this._onKick.bind(this);
        this._onMuteEveryoneElse = this._onMuteEveryoneElse.bind(this);
        this._onMuteVideo = this._onMuteVideo.bind(this);
        this._onSendPrivateMessage = this._onSendPrivateMessage.bind(this);
        this._onStopSharedVideo = this._onStopSharedVideo.bind(this);
        this._onVolumeChange = this._onVolumeChange.bind(this);
        this._onAskToUnmute = this._onAskToUnmute.bind(this);
    }

    _getCurrentParticipantId: () => string;

    /**
     * Returns the participant id for the item we want to operate.
     *
     * @returns {void}
     */
    _getCurrentParticipantId() {
        const { _participant, drawerParticipant, overflowDrawer } = this.props;

        return overflowDrawer ? drawerParticipant?.participantID : _participant?.id;
    }

    _onGrantModerator: () => void;

    /**
     * Grant moderator permissions.
     *
     * @returns {void}
     */
    _onGrantModerator() {
        this.props.dispatch(openDialog(GrantModeratorDialog, {
            participantID: this._getCurrentParticipantId()
        }));
    }

    _onKick: () => void;

    /**
     * Kicks the participant.
     *
     * @returns {void}
     */
    _onKick() {
        this.props.dispatch(openDialog(KickRemoteParticipantDialog, {
            participantID: this._getCurrentParticipantId()
        }));
    }

    _onStopSharedVideo: () => void;

    /**
     * Stops shared video.
     *
     * @returns {void}
     */
    _onStopSharedVideo() {
        const { dispatch } = this.props;

        dispatch(this._onStopSharedVideo());
    }

    _onMuteEveryoneElse: () => void;

    /**
     * Mutes everyone else.
     *
     * @returns {void}
     */
    _onMuteEveryoneElse() {
        this.props.dispatch(openDialog(MuteEveryoneDialog, {
            exclude: [ this._getCurrentParticipantId() ]
        }));
    }

    _onMuteVideo: () => void;

    /**
     * Mutes the video of the selected participant.
     *
     * @returns {void}
     */
    _onMuteVideo() {
        this.props.dispatch(openDialog(MuteRemoteParticipantsVideoDialog, {
            participantID: this._getCurrentParticipantId()
        }));
    }

    _onSendPrivateMessage: () => void;

    /**
     * Sends private message.
     *
     * @returns {void}
     */
    _onSendPrivateMessage() {
        const { dispatch } = this.props;

        dispatch(openChatById(this._getCurrentParticipantId()));
    }

    _onVolumeChange: (number) => void;

    /**
     * Handles volume changes.
     *
     * @param {number} value - The new value for the volume.
     * @returns {void}
     */
    _onVolumeChange(value) {
        const { _participant, dispatch } = this.props;
        const { id } = _participant;

        dispatch(setVolume(id, value));
    }

    _onAskToUnmute: () => void;

    /**
     * Handles click on ask to unmute.
     *
     * @returns {void}
     */
    _onAskToUnmute() {
        const { _participant, dispatch } = this.props;
        const { id } = _participant;

        dispatch(approveParticipant(id));
    }


    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _isAudioForceMuted,
            _isLocalModerator,
            _isChatButtonEnabled,
            _isParticipantModerator,
            _isParticipantVideoMuted,
            _isParticipantAudioMuted,
            _isVideoForceMuted,
            _localVideoOwner,
            _participant,
            _volume = 1,
            closeDrawer,
            drawerParticipant,
            offsetTarget,
            onEnter,
            onLeave,
            onSelect,
            overflowDrawer,
            muteAudio,
            t
        } = this.props;

        if (!_participant) {
            return null;
        }

        const showVolumeSlider = !isIosMobileBrowser()
            && overflowDrawer
            && typeof _volume === 'number'
            && !isNaN(_volume);

        const fakeParticipantActions = [ {
            accessibilityLabel: t('toolbar.stopSharedVideo'),
            icon: IconShareVideo,
            onClick: this._onStopSharedVideo,
            text: t('toolbar.stopSharedVideo')
        } ];

        const moderatorActions1 = [
            overflowDrawer && (_isAudioForceMuted || _isVideoForceMuted) ? {
                accessibilityLabel: t(_isAudioForceMuted
                    ? 'participantsPane.actions.askUnmute'
                    : 'participantsPane.actions.allowVideo'),
                icon: IconMicrophone,
                onClick: this._onAskToUnmute,
                text: t(_isAudioForceMuted
                    ? 'participantsPane.actions.askUnmute'
                    : 'participantsPane.actions.allowVideo')
            } : null,
            !_isParticipantAudioMuted && overflowDrawer ? {
                accessibilityLabel: t('dialog.muteParticipantButton'),
                icon: IconMicDisabled,
                onClick: muteAudio(_participant),
                text: t('dialog.muteParticipantButton')
            } : null, {
                accessibilityLabel: t('toolbar.accessibilityLabel.muteEveryoneElse'),
                icon: IconMuteEveryoneElse,
                onClick: this._onMuteEveryoneElse,
                text: t('toolbar.accessibilityLabel.muteEveryoneElse')
            },
            _isParticipantVideoMuted ? null : {
                accessibilityLabel: t('participantsPane.actions.stopVideo'),
                icon: IconVideoOff,
                onClick: this._onMuteVideo,
                text: t('participantsPane.actions.stopVideo')
            }
        ].filter(Boolean);

        const moderatorActions2 = [
            _isLocalModerator && !_isParticipantModerator ? {
                accessibilityLabel: t('toolbar.accessibilityLabel.grantModerator'),
                icon: IconCrown,
                onClick: this._onGrantModerator,
                text: t('toolbar.accessibilityLabel.grantModerator')
            } : null,
            _isLocalModerator ? {
                accessibilityLabel: t('videothumbnail.kick'),
                icon: IconCloseCircle,
                onClick: this._onKick,
                text: t('videothumbnail.kick')
            } : null,
            _isChatButtonEnabled ? {
                accessibilityLabel: t('toolbar.accessibilityLabel.privateMessage'),
                icon: IconMessage,
                onClick: this._onSendPrivateMessage,
                text: t('toolbar.accessibilityLabel.privateMessage')
            } : null
        ].filter(Boolean);

        const actions
            = _participant?.isFakeParticipant ? (
                <>
                    {_localVideoOwner && (
                        <ContextMenuItemGroup
                            actions = { fakeParticipantActions } />
                    )}
                </>
            ) : (
                <>
                    {_isLocalModerator
                        && <ContextMenuItemGroup actions = { moderatorActions1 } />
                    }

                    <ContextMenuItemGroup actions = { moderatorActions2 } />
                    { showVolumeSlider
                        && <ContextMenuItemGroup>
                            <VolumeSlider
                                initialValue = { _volume }
                                key = 'volume-slider'
                                onChange = { this._onVolumeChange } />
                        </ContextMenuItemGroup>
                    }
                </>
            );

        return (
            <ContextMenu
                entity = { _participant }
                isDrawerOpen = { drawerParticipant }
                offsetTarget = { offsetTarget }
                onClick = { onSelect }
                onDrawerClose = { closeDrawer }
                onMouseEnter = { onEnter }
                onMouseLeave = { onLeave }>
                {overflowDrawer && <ContextMenuItemGroup
                    actions = { [ {
                        accessibilityLabel: drawerParticipant && drawerParticipant.displayName,
                        customIcon: <Avatar
                            participantId = { drawerParticipant && drawerParticipant.participantID }
                            size = { 20 } />,
                        text: drawerParticipant && drawerParticipant.displayName
                    } ] } />}
                {actions}
            </ContextMenu>
        );
    }
}

/**
 * Maps (parts of) the redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state, ownProps): Object {
    const { participantID, overflowDrawer, drawerParticipant } = ownProps;
    const { ownerId } = state['features/shared-video'];
    const localParticipantId = getLocalParticipant(state).id;

    const participant = getParticipantByIdOrUndefined(state,
        overflowDrawer ? drawerParticipant?.participantID : participantID);

    const _isLocalModerator = isLocalParticipantModerator(state);
    const _isChatButtonEnabled = isToolbarButtonEnabled('chat', state);
    const _isParticipantVideoMuted = isParticipantVideoMuted(participant, state);
    const _isParticipantAudioMuted = isParticipantAudioMuted(participant, state);
    const _isParticipantModerator = isParticipantModerator(participant);

    const { participantsVolume } = state['features/filmstrip'];
    const id = participant?.id;
    const isLocal = participant?.local ?? true;

    return {
        _isAudioForceMuted: isForceMuted(participant, MEDIA_TYPE.AUDIO, state),
        _isLocalModerator,
        _isChatButtonEnabled,
        _isParticipantModerator,
        _isParticipantVideoMuted,
        _isParticipantAudioMuted,
        _isVideoForceMuted: isForceMuted(participant, MEDIA_TYPE.VIDEO, state),
        _localVideoOwner: Boolean(ownerId === localParticipantId),
        _participant: participant,
        _volume: isLocal ? undefined : id ? participantsVolume[id] : undefined
    };
}

export default translate(connect(_mapStateToProps)(MeetingParticipantContextMenu));
