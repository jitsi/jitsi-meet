// @flow

import React, { Component } from 'react';

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
import { isParticipantAudioMuted, isParticipantVideoMuted } from '../../../base/tracks';
import { openChat } from '../../../chat/actions';
import { stopSharedVideo } from '../../../shared-video/actions.any';
import { GrantModeratorDialog, KickRemoteParticipantDialog, MuteEveryoneDialog } from '../../../video-menu';
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
     * The dispatch function from redux.
     */
    dispatch: Function,

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

        this._onGrantModerator = this._onGrantModerator.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKick = this._onKick.bind(this);
        this._onMuteEveryoneElse = this._onMuteEveryoneElse.bind(this);
        this._onMuteVideo = this._onMuteVideo.bind(this);
        this._onSendPrivateMessage = this._onSendPrivateMessage.bind(this);
        this._position = this._position.bind(this);
    }

    _onGrantModerator: () => void;

    /**
     * Grant moderator permissions.
     *
     * @returns {void}
     */
    _onGrantModerator() {
        const { _participant, dispatch } = this.props;

        dispatch(openDialog(GrantModeratorDialog, {
            participantID: _participant?.id
        }));
    }

    _onKick: () => void;

    /**
     * Kicks the participant.
     *
     * @returns {void}
     */
    _onKick() {
        const { _participant, dispatch } = this.props;

        dispatch(openDialog(KickRemoteParticipantDialog, {
            participantID: _participant?.id
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

        dispatch(stopSharedVideo());
    }

    _onMuteEveryoneElse: () => void;

    /**
     * Mutes everyone else.
     *
     * @returns {void}
     */
    _onMuteEveryoneElse() {
        const { _participant, dispatch } = this.props;

        dispatch(openDialog(MuteEveryoneDialog, {
            exclude: [ _participant?.id ]
        }));
    }

    _onMuteVideo: () => void;

    /**
     * Mutes the video of the selected participant.
     *
     * @returns {void}
     */
    _onMuteVideo() {
        const { _participant, dispatch } = this.props;

        dispatch(openDialog(MuteRemoteParticipantsVideoDialog, {
            participantID: _participant?.id
        }));
    }

    _onSendPrivateMessage: () => void;

    /**
     * Sends private message.
     *
     * @returns {void}
     */
    _onSendPrivateMessage() {
        const { _participant, dispatch } = this.props;

        dispatch(openChat(_participant));
    }

    _onKeyDown: (KeyboardEvent) => void;

    /**
     * On keydown event.
     *
     * @param {Event} e - Key down event object.
     * @returns {void}
     */
    _onKeyDown(e) {
        const focusableElements = 'div, [tabindex]:not([tabindex="-1"])';
        const contextMenu = document.getElementsByClassName(ignoredChildClassName)[0];
        const firstFocusableElement = contextMenu.querySelectorAll(focusableElements)[0];
        const focusableContent = contextMenu.querySelectorAll(focusableElements);
        const lastFocusableElement = focusableContent[focusableContent.length - 2];

        if (document.activeElement === contextMenu && e.key === 'Enter') {
            firstFocusableElement.focus();
            e.preventDefault();
        }

        if (document.activeElement === contextMenu && e.key === 'Escape') {
            firstFocusableElement.blur();
            e.preventDefault();
        }

        if (e.shiftKey) {
            if (document.activeElement === firstFocusableElement) {
                lastFocusableElement.focus();
                e.preventDefault();
            }
        } else if (document.activeElement === lastFocusableElement) {
            firstFocusableElement.focus();
            e.preventDefault();
        }

        firstFocusableElement.focus();
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
            const {
                offsetTop,
                offsetParent: { offsetHeight, scrollTop }
            } = offsetTarget;
            const outerHeight = getComputedOuterHeight(container);

            container.style.top = offsetTop + outerHeight > offsetHeight + scrollTop
                ? offsetTop - outerHeight
                : offsetTop;

            this.setState({ isHidden: false });
        } else {
            this.setState({ isHidden: true });
        }
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
            onEnter,
            onLeave,
            onSelect,
            muteAudio,
            t
        } = this.props;

        if (!_participant) {
            return null;
        }

        return (
            <ContextMenu
                className = { ignoredChildClassName }
                innerRef = { this._containerRef }
                isHidden = { this.state.isHidden }
                onClick = { onSelect }
                onKeyDown = { this._onKeyDown }
                onMouseEnter = { onEnter }
                onMouseLeave = { onLeave }
                tabIndex = '0'>
                {
                    !_participant.isFakeParticipant && (
                        <>
                            <ContextMenuItemGroup>
                                {
                                    _isLocalModerator && (
                                        <>
                                            {
                                                !_isParticipantAudioMuted
                                                && <ContextMenuItem
                                                    onClick = { muteAudio(_participant) }
                                                    /* eslint-disable-next-line react/jsx-no-bind,max-len */
                                                    onKeyDown = { e => {
                                                        if (e.key === 'Enter') {
                                                            muteAudio(_participant);
                                                        }
                                                    } }
                                                    tabIndex = '0'>
                                                    <ContextMenuIcon
                                                        src = { IconMicDisabled } />
                                                    <span>{t('dialog.muteParticipantButton')}</span>
                                                </ContextMenuItem>
                                            }

                                            <ContextMenuItem
                                                onClick = { this._onMuteEveryoneElse }
                                                /* eslint-disable-next-line react/jsx-no-bind */
                                                onKeyDown = { e => {
                                                    if (e.key === 'Enter') {
                                                        this._onMuteEveryoneElse();
                                                    }
                                                } }
                                                tabIndex = '0'>
                                                <ContextMenuIcon
                                                    src = { IconMuteEveryoneElse } />
                                                <span>{t('toolbar.accessibilityLabel.muteEveryoneElse')}</span>
                                            </ContextMenuItem>
                                        </>
                                    )
                                }

                                {
                                    _isLocalModerator && (
                                        _isParticipantVideoMuted || (
                                            <ContextMenuItem
                                                onClick = { this._onMuteVideo }
                                                /* eslint-disable-next-line react/jsx-no-bind */
                                                onKeyDown = { e => {
                                                    if (e.key === 'Enter') {
                                                        this._onMuteVideo();
                                                    }
                                                } }
                                                tabIndex = '0'>
                                                <ContextMenuIcon
                                                    src = { IconVideoOff } />
                                                <span>{t('participantsPane.actions.stopVideo')}</span>
                                            </ContextMenuItem>
                                        )
                                    )
                                }
                            </ContextMenuItemGroup>

                            <ContextMenuItemGroup>
                                {
                                    _isLocalModerator && (
                                        <>
                                            {
                                                !_isParticipantModerator && (
                                                    <ContextMenuItem
                                                        onClick = { this._onGrantModerator }
                                                        /* eslint-disable-next-line react/jsx-no-bind,max-len */
                                                        onKeyDown = { e => {
                                                            if (e.key === 'Enter') {
                                                                this._onGrantModerator();
                                                            }
                                                        } }
                                                        tabIndex = '0'>
                                                        <ContextMenuIcon
                                                            src = { IconCrown } />
                                                        <span>{t('toolbar.accessibilityLabel.grantModerator')}</span>
                                                    </ContextMenuItem>
                                                )
                                            }
                                            <ContextMenuItem
                                                onClick = { this._onKick }
                                                /* eslint-disable-next-line react/jsx-no-bind */
                                                onKeyDown = { e => {
                                                    if (e.key === 'Enter') {
                                                        this._onKick();
                                                    }
                                                } }
                                                tabIndex = '0'>
                                                <ContextMenuIcon
                                                    src = { IconCloseCircle } />
                                                <span>{t('videothumbnail.kick')}</span>
                                            </ContextMenuItem>
                                        </>
                                    )
                                }
                                {
                                    _isChatButtonEnabled && (
                                        <ContextMenuItem
                                            onClick = { this._onSendPrivateMessage }
                                            /* eslint-disable-next-line react/jsx-no-bind */
                                            onKeyDown = { e => {
                                                if (e.key === 'Enter') {
                                                    this._onSendPrivateMessage();
                                                }
                                            } }
                                            tabIndex = '0'>
                                            <ContextMenuIcon src = { IconMessage } />
                                            <span>{t('toolbar.accessibilityLabel.privateMessage')}</span>
                                        </ContextMenuItem>
                                    )
                                }
                            </ContextMenuItemGroup>
                        </>
                    )
                }
                {
                    _participant.isFakeParticipant && _localVideoOwner && (
                        <ContextMenuItem
                            onClick = { this._onStopSharedVideo }
                            /* eslint-disable-next-line react/jsx-no-bind */
                            onKeyDown = { e => {
                                if (e.key === 'Enter') {
                                    this._onStopSharedVideo();
                                }
                            } }
                            tabIndex = '0'>
                            <ContextMenuIcon src = { IconShareVideo } />
                            <span>{t('toolbar.stopSharedVideo')}</span>
                        </ContextMenuItem>
                    )
                }
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
    const { participantID } = ownProps;
    const { ownerId } = state['features/shared-video'];
    const localParticipantId = getLocalParticipant(state).id;
    const participant = getParticipantByIdOrUndefined(state, participantID);

    const _isLocalModerator = isLocalParticipantModerator(state);
    const _isChatButtonEnabled = isToolbarButtonEnabled('chat', state);
    const _isParticipantVideoMuted = isParticipantVideoMuted(participant, state);
    const _isParticipantAudioMuted = isParticipantAudioMuted(participant, state);
    const _isParticipantModerator = isParticipantModerator(participant);

    return {
        _isLocalModerator,
        _isChatButtonEnabled,
        _isParticipantModerator,
        _isParticipantVideoMuted,
        _isParticipantAudioMuted,
        _localVideoOwner: Boolean(ownerId === localParticipantId),
        _participant: participant
    };
}

export default translate(connect(_mapStateToProps)(MeetingParticipantContextMenu));
