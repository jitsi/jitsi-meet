// @flow
import { withStyles } from '@material-ui/core/styles';
import React, { Component } from 'react';

import { Avatar } from '../../../base/avatar';
import { isToolbarButtonEnabled } from '../../../base/config/functions.web';
import { openDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import {
    IconCloseCircle,
    IconCrown,
    IconMessage,
    IconMicDisabled,
    IconMuteEveryoneElse,
    IconShareVideo,
    IconVideoOff
} from '../../../base/icons';
import {
    getLocalParticipant,
    getParticipantByIdOrUndefined,
    isLocalParticipantModerator,
    isParticipantModerator
} from '../../../base/participants';
import { connect } from '../../../base/redux';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import { isParticipantAudioMuted, isParticipantVideoMuted } from '../../../base/tracks';
import { openChatById } from '../../../chat/actions';
import { setVolume } from '../../../filmstrip/actions.web';
import { Drawer, DrawerPortal } from '../../../toolbox/components/web';
import { GrantModeratorDialog, KickRemoteParticipantDialog, MuteEveryoneDialog } from '../../../video-menu';
import { VolumeSlider } from '../../../video-menu/components/web';
import MuteRemoteParticipantsVideoDialog from '../../../video-menu/components/web/MuteRemoteParticipantsVideoDialog';
import { getComputedOuterHeight } from '../../functions';

import {
    ContextMenu,
    ContextMenuIcon,
    ContextMenuItem,
    ContextMenuItemGroup,
    ignoredChildClassName
} from './styled';

type Props = {

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
     * Shared video local participant owner.
     */
    _localVideoOwner: boolean,

    /**
     * Participant reference
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
     * Target elements against which positioning calculations are made
     */
    offsetTarget: HTMLElement,

    /**
     * Callback for the mouse entering the component
     */
    onEnter: Function,

    /**
     * Callback for the mouse leaving the component
     */
    onLeave: Function,

    /**
     * Callback for making a selection in the menu
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

type State = {

    /**
     * If true the context menu will be hidden.
     */
    isHidden: boolean
};

const styles = theme => {
    return {
        drawer: {
            '& > div': {
                ...withPixelLineHeight(theme.typography.bodyShortRegularLarge),
                lineHeight: '32px',

                '& svg': {
                    fill: theme.palette.icon01
                }
            },
            '&:first-child': {
                marginTop: 15
            }
        }
    };
};


/**
 * Implements the MeetingParticipantContextMenu component.
 */
class MeetingParticipantContextMenu extends Component<Props, State> {

    /**
     * Reference to the context menu container div.
     */
    _containerRef: Object;

    /**
     * Creates new instance of MeetingParticipantContextMenu.
     *
     * @param {Props} props - The props.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            isHidden: true
        };

        this._containerRef = React.createRef();

        this._getCurrentParticipantId = this._getCurrentParticipantId.bind(this);
        this._onGrantModerator = this._onGrantModerator.bind(this);
        this._onKick = this._onKick.bind(this);
        this._onMuteEveryoneElse = this._onMuteEveryoneElse.bind(this);
        this._onMuteVideo = this._onMuteVideo.bind(this);
        this._onSendPrivateMessage = this._onSendPrivateMessage.bind(this);
        this._position = this._position.bind(this);
        this._onVolumeChange = this._onVolumeChange.bind(this);
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
        const { closeDrawer, dispatch, overflowDrawer } = this.props;

        dispatch(openChatById(this._getCurrentParticipantId()));
        overflowDrawer && closeDrawer();
    }

    _position: () => void;

    /**
     * Positions the context menu.
     *
     * @returns {void}
     */
    _position() {
        const { _participant, offsetTarget } = this.props;

        if (_participant
            && this._containerRef.current
            && offsetTarget?.offsetParent
            && offsetTarget.offsetParent instanceof HTMLElement
        ) {
            const { current: container } = this._containerRef;
            const { offsetTop, offsetParent: { offsetHeight, scrollTop } } = offsetTarget;
            const outerHeight = getComputedOuterHeight(container);

            container.style.top = offsetTop + outerHeight > offsetHeight + scrollTop
                ? offsetTop - outerHeight
                : offsetTop;

            this.setState({ isHidden: false });
        } else {
            this.setState({ isHidden: true });
        }
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

    /**
     * Implements React Component's componentDidMount.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        this._position();
    }

    /**
     * Implements React Component's componentDidUpdate.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps: Props) {
        if (prevProps.offsetTarget !== this.props.offsetTarget || prevProps._participant !== this.props._participant) {
            this._position();
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _isLocalModerator,
            _isChatButtonEnabled,
            _isParticipantModerator,
            _isParticipantVideoMuted,
            _isParticipantAudioMuted,
            _localVideoOwner,
            _participant,
            _volume = 1,
            classes,
            closeDrawer,
            drawerParticipant,
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

        const actions
            = _participant?.isFakeParticipant ? (
                <>
                    {_localVideoOwner && (
                        <ContextMenuItem onClick = { this._onStopSharedVideo }>
                            <ContextMenuIcon src = { IconShareVideo } />
                            <span>{t('toolbar.stopSharedVideo')}</span>
                        </ContextMenuItem>
                    )}
                </>
            ) : (
                <>
                    {_isLocalModerator && (
                        <ContextMenuItemGroup>
                            <>
                                {
                                    !_isParticipantAudioMuted && overflowDrawer
                                    && <ContextMenuItem onClick = { muteAudio(_participant) }>
                                        <ContextMenuIcon src = { IconMicDisabled } />
                                        <span>{t('dialog.muteParticipantButton')}</span>
                                    </ContextMenuItem>
                                }

                                <ContextMenuItem onClick = { this._onMuteEveryoneElse }>
                                    <ContextMenuIcon src = { IconMuteEveryoneElse } />
                                    <span>{t('toolbar.accessibilityLabel.muteEveryoneElse')}</span>
                                </ContextMenuItem>
                            </>

                            {
                                _isParticipantVideoMuted || (
                                    <ContextMenuItem onClick = { this._onMuteVideo }>
                                        <ContextMenuIcon src = { IconVideoOff } />
                                        <span>{t('participantsPane.actions.stopVideo')}</span>
                                    </ContextMenuItem>
                                )
                            }
                        </ContextMenuItemGroup>
                    )}

                    <ContextMenuItemGroup>
                        {
                            _isLocalModerator && (
                                    <>
                                        {
                                            !_isParticipantModerator && (
                                                <ContextMenuItem onClick = { this._onGrantModerator }>
                                                    <ContextMenuIcon src = { IconCrown } />
                                                    <span>{t('toolbar.accessibilityLabel.grantModerator')}</span>
                                                </ContextMenuItem>
                                            )
                                        }
                                        <ContextMenuItem onClick = { this._onKick }>
                                            <ContextMenuIcon src = { IconCloseCircle } />
                                            <span>{ t('videothumbnail.kick') }</span>
                                        </ContextMenuItem>
                                    </>
                            )
                        }
                        {
                            _isChatButtonEnabled && (
                                <ContextMenuItem onClick = { this._onSendPrivateMessage }>
                                    <ContextMenuIcon src = { IconMessage } />
                                    <span>{t('toolbar.accessibilityLabel.privateMessage')}</span>
                                </ContextMenuItem>
                            )
                        }
                    </ContextMenuItemGroup>
                    { overflowDrawer && typeof _volume === 'number' && !isNaN(_volume)
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
            <>
                { !overflowDrawer
                  && <ContextMenu
                      className = { ignoredChildClassName }
                      innerRef = { this._containerRef }
                      isHidden = { this.state.isHidden }
                      onClick = { onSelect }
                      onMouseEnter = { onEnter }
                      onMouseLeave = { onLeave }>
                      { actions }
                  </ContextMenu>}

                <DrawerPortal>
                    <Drawer
                        isOpen = { drawerParticipant && overflowDrawer }
                        onClose = { closeDrawer }>
                        <div className = { classes && classes.drawer }>
                            <ContextMenuItemGroup>
                                <ContextMenuItem>
                                    <Avatar
                                        participantId = { drawerParticipant && drawerParticipant.participantID }
                                        size = { 20 } />
                                    <span>{ drawerParticipant && drawerParticipant.displayName }</span>
                                </ContextMenuItem>
                            </ContextMenuItemGroup>
                            { actions }
                        </div>
                    </Drawer>
                </DrawerPortal>
            </>
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
        _isLocalModerator,
        _isChatButtonEnabled,
        _isParticipantModerator,
        _isParticipantVideoMuted,
        _isParticipantAudioMuted,
        _localVideoOwner: Boolean(ownerId === localParticipantId),
        _participant: participant,
        _volume: isLocal ? undefined : id ? participantsVolume[id] : undefined
    };
}

export default withStyles(styles)(translate(connect(_mapStateToProps)(MeetingParticipantContextMenu)));
