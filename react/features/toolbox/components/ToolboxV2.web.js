// @flow

import React from 'react';
import { connect } from 'react-redux';

import {
    createToolbarEvent,
    sendAnalytics
} from '../../analytics';
import { disconnect } from '../../base/connection';
import { openDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import {
    PARTICIPANT_ROLE,
    getLocalParticipant,
    participantUpdated
} from '../../base/participants';
import { getLocalVideoTrack, toggleScreenshare } from '../../base/tracks';
import { openFeedbackDialog } from '../../feedback';
import { AddPeopleDialog, InfoDialogButton } from '../../invite';
import { openKeyboardShortcutsDialog } from '../../keyboard-shortcuts';
import { SpeakerStats } from '../../speaker-stats';

import { setToolbarHovered } from '../actions';
import { abstractMapStateToProps } from '../functions';

import AbstractToolbox from './AbstractToolbox';
import type { Props as AbstractToolboxProps } from './AbstractToolbox';
import OverflowMenuButton from './OverflowMenuButton';
import OverflowMenuItem from './OverflowMenuItem';
import ToolbarButtonV2 from './ToolbarButtonV2';

type Props = AbstractToolboxProps & {

    /**
     * Whether or not the feature for adding people directly into the call
     * is enabled.
     */
    _addPeopleAvailable: boolean,

    /**
     * The {@code JitsiConference} for the current conference.
     */
    _conference: Object,

    /**
     * Whether or not the feature for telephony to dial out to a number is
     * enabled.
     */
    _dialOutAvailable: boolean,

    /**
     * Whether or not a dialog is currently visible. The overflow menu should
     * be closed if so.
     */
    _dialogVisible: boolean,

    /**
     * The ID of the local participant.
     */
    _localParticipantID: String,

    /**
     * Whether or not the local participant's hand is raised.
     */
    _raisedHand: boolean,

    /**
     * Whether or not the local participant is screensharing.
     */
    _screensharing: boolean,

    /**
     * Flag showing whether toolbar is visible.
     */
    _visible: boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
}

type State = {
    showOverflowMenu: boolean
};

/**
 * Implements the conference toolbox on React/Web.
 *
 * @extends Component
 */
class ToolboxV2 extends AbstractToolbox<Props, State> {
    state = {
        showOverflowMenu: false
    };

    /**
     * Initializes a new {@code Toolbox} instance.
     *
     * @param {Props} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onHangup = this._onHangup.bind(this);
        this._onMouseOut = this._onMouseOut.bind(this);
        this._onMouseOver = this._onMouseOver.bind(this);
        this._onOpenFeedback = this._onOpenFeedback.bind(this);
        this._onOpenKeyboardShortcuts
            = this._onOpenKeyboardShortcuts.bind(this);
        this._onOpenSpeakerStats = this._onOpenSpeakerStats.bind(this);
        this._onShowInvite = this._onShowInvite.bind(this);
        this._onSetOverflowVisible = this._onSetOverflowVisible.bind(this);
        this._onToggleAudio = this._onToggleAudio.bind(this);
        this._onToggleRaiseHand = this._onToggleRaiseHand.bind(this);
        this._onToggleScreenshare = this._onToggleScreenshare.bind(this);
        this._onToggleVideo = this._onToggleVideo.bind(this);
    }

    /**
     * Update the visibility of the {@code OverflowMenuButton}.
     *
     * @inheritdoc
     */
    componentWillReceiveProps(nextProps) {
        const { showOverflowMenu } = this.state;

        // Ensure the dialog is closed when the toolbox becomes hidden or
        // a dialog is opened.
        if (showOverflowMenu
                && (!nextProps._visible || nextProps._dialogVisible)) {
            this._onSetOverflowVisible(false);
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
            _addPeopleAvailable,
            _audioMuted,
            _conference,
            _dialOutAvailable,
            _raisedHand,
            _screensharing,
            _videoMuted,
            _visible,
            t
        } = this.props;
        const rootClassNames = `new-toolbox ${_visible ? 'visible' : ''}`;

        return (
            <div
                className = { rootClassNames }
                onMouseOut = { this._onMouseOut }
                onMouseOver = { this._onMouseOver }>
                <div className = 'button-group-left'>
                    <ToolbarButtonV2
                        iconName = { _screensharing
                            ? 'icon-share-desktop toggled'
                            : 'icon-share-desktop' }
                        onClick = { this._onToggleScreenshare }
                        tooltip = { t('toolbar.sharescreen') } />
                    <ToolbarButtonV2
                        iconName = { _raisedHand
                            ? 'icon-raised-hand toggled'
                            : 'icon-raised-hand' }
                        onClick = { this._onToggleRaiseHand }
                        tooltip = { t('toolbar.raiseHand') } />
                </div>
                <div className = 'button-group-center'>
                    <ToolbarButtonV2
                        iconName = { _audioMuted && _conference
                            ? 'icon-mic-disabled toggled'
                            : 'icon-microphone' }
                        onClick = { this._onToggleAudio }
                        tooltip = { t('toolbar.mute') } />
                    <ToolbarButtonV2
                        iconName = 'icon-hangup'
                        onClick = { this._onHangup }
                        tooltip = { t('toolbar.hangup') } />
                    <ToolbarButtonV2
                        iconName = { _videoMuted && _conference
                            ? 'icon-camera-disabled toggled'
                            : 'icon-camera' }
                        onClick = { this._onToggleVideo }
                        tooltip = { t('toolbar.videomute') } />
                </div>
                <div className = 'button-group-right'>
                    <ToolbarButtonV2
                        iconName = 'icon-add'
                        onClick = { this._onShowInvite }
                        tooltip = { _addPeopleAvailable || _dialOutAvailable
                            ? t('addPeople.title')
                            : t('addPeople.notAvailable') } />
                    <InfoDialogButton />
                    <OverflowMenuButton
                        isOpen = { this.state.showOverflowMenu }
                        onVisibilityChange = { this._onSetOverflowVisible }>
                        <ul className = 'overflow-menu'>
                            <OverflowMenuItem
                                icon = 'icon-presentation'
                                onClick = { this._onOpenSpeakerStats }
                                text = { t('toolbar.speakerStats') } />
                            <OverflowMenuItem
                                icon = 'icon-feedback'
                                onClick = { this._onOpenFeedback }
                                text = { t('toolbar.feedback') } />
                            <OverflowMenuItem
                                icon = 'icon-link'
                                onClick = { this._onOpenKeyboardShortcuts }
                                text = { t('toolbar.shortcuts') } />
                        </ul>
                    </OverflowMenuButton>
                </div>
            </div>
        );
    }

    _onHangup: () => void;

    /**
     * Dispatches an action to leave the current conference.
     *
     * @private
     * @returns {void}
     */
    _onHangup() {
        sendAnalytics(createToolbarEvent('hangup'));
        this.props.dispatch(disconnect(true));
    }

    _onMouseOut: () => void;

    /**
     * Dispatches an action signaling the toolbar is not being hovered.
     *
     * @private
     * @returns {void}
     */
    _onMouseOut() {
        this.props.dispatch(setToolbarHovered(false));
    }

    _onMouseOver: () => void;

    /**
     * Dispatches an action signaling the toolbar is being hovered.
     *
     * @private
     * @returns {void}
     */
    _onMouseOver() {
        this.props.dispatch(setToolbarHovered(true));
    }

    _onOpenFeedback: () => void;

    /**
     * Callback invoked to display {@code FeedbackDialog}.
     *
     * @private
     * @returns {void}
     */
    _onOpenFeedback() {
        this.props.dispatch(openFeedbackDialog());
    }

    _onOpenKeyboardShortcuts: () => void;

    /**
     * Callback invoked to display {@code KeyboardShortcuts}.
     *
     * @private
     * @returns {void}
     */
    _onOpenKeyboardShortcuts() {
        this.props.dispatch(openKeyboardShortcutsDialog());
    }

    _onOpenSpeakerStats: () => void;

    /**
     * Callback invoked to display {@code SpeakerStats}.
     *
     * @private
     * @returns {void}
     */
    _onOpenSpeakerStats() {
        this.props.dispatch(openDialog(SpeakerStats, {
            conference: this.props._conference
        }));
    }

    _onSetOverflowVisible: (boolean) => void;

    /**
     * Sets the visibility of the overflow menu.
     *
     * @param {boolean} visible - Whether or not the overflow menu should be
     * displayed.
     * @private
     * @returns {void}
     */
    _onSetOverflowVisible(visible) {
        this.setState({ showOverflowMenu: visible });
    }

    _onShowInvite: () => void;

    /**
     * Opens the dialog for inviting people directly into the conference.
     *
     * @private
     * @returns {void}
     */
    _onShowInvite() {
        const { _addPeopleAvailable, _dialOutAvailable, dispatch } = this.props;

        if (_addPeopleAvailable || _dialOutAvailable) {
            dispatch(openDialog(AddPeopleDialog, {
                addPeople: _addPeopleAvailable,
                dialOut: _dialOutAvailable
            }));
        }
    }

    _onToggleAudio: () => void;

    _onToggleOverflowMenu: () => void;

    /**
     * Callback invoked to change whether the {@code OverflowMenu} is displayed
     * or not.
     *
     * @private
     * @returns {void}
     */
    _onToggleOverflowMenu() {
        this.setState({ showOverflowMenu: !this.state.showOverflowMenu });
    }

    _onToggleRaiseHand: () => void;

    /**
     * Dispatches an action to toggle the local participant's raised hand state.
     *
     * @private
     * @returns {void}
     */
    _onToggleRaiseHand() {
        const { _localParticipantID, _raisedHand } = this.props;

        this.props.dispatch(participantUpdated({
            id: _localParticipantID,
            local: true,
            raisedHand: !_raisedHand
        }));
    }

    _onToggleScreenshare: () => void;

    /**
     * Dispatches an action to toggle screensharing.
     *
     * @private
     * @returns {void}
     */
    _onToggleScreenshare() {
        this.props.dispatch(toggleScreenshare());
    }

    _onToggleVideo: () => void;
}

/**
 * Maps (parts of) the redux state to {@link Toolbox}'s React {@code Component}
 * props.
 *
 * @param {Object} state - The redux store/state.
 * @private
 * @returns {{}}
 */
function _mapStateToProps(state) {
    const localParticipant = getLocalParticipant(state);
    const localVideo = getLocalVideoTrack(state['features/base/tracks']);

    const { conference } = state['features/base/conference'];
    const { enableUserRolesBasedOnToken } = state['features/base/config'];
    const { isGuest } = state['features/base/jwt'];
    const { alwaysVisible, timeoutID, visible } = state['features/toolbox'];

    return {
        ...abstractMapStateToProps(state),
        _addPeopleAvailable: !isGuest,
        _conference: conference,
        _dialOutAvailable: localParticipant.role === PARTICIPANT_ROLE.MODERATOR
            && conference && conference.isSIPCallingSupported()
            && (!enableUserRolesBasedOnToken || !isGuest),
        _dialogVisible: Boolean(state['features/base/dialog'].component),
        _localParticipantID: localParticipant.id,
        _raisedHand: localParticipant.raisedHand,
        _screensharing: localVideo && localVideo.videoType === 'desktop',
        _visible: (timeoutID && visible) || alwaysVisible
    };
}

export default translate(connect(_mapStateToProps)(ToolboxV2));
