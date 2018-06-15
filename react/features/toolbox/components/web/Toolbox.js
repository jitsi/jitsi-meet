// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
    ACTION_SHORTCUT_TRIGGERED,
    createShortcutEvent,
    createToolbarEvent,
    sendAnalytics
} from '../../../analytics';
import { openDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import {
    getLocalParticipant,
    getParticipants,
    isLocalParticipantModerator,
    participantUpdated
} from '../../../base/participants';
import { getLocalVideoTrack, toggleScreensharing } from '../../../base/tracks';
import { ChatCounter } from '../../../chat';
import { toggleDocument } from '../../../etherpad';
import { openFeedbackDialog } from '../../../feedback';
import {
    beginAddPeople,
    InfoDialogButton,
    isAddPeopleEnabled,
    isDialOutEnabled
} from '../../../invite';
import { openKeyboardShortcutsDialog } from '../../../keyboard-shortcuts';
import {
    StartLiveStreamDialog,
    StartRecordingDialog,
    StopLiveStreamDialog,
    StopRecordingDialog,
    getActiveSession
} from '../../../recording';
import { SettingsButton } from '../../../settings';
import { toggleSharedVideo } from '../../../shared-video';
import { toggleChat, toggleProfile } from '../../../side-panel';
import { SpeakerStats } from '../../../speaker-stats';
import {
    OverflowMenuVideoQualityItem,
    VideoQualityDialog
} from '../../../video-quality';

import {
    setFullScreen,
    setOverflowMenuVisible,
    setToolbarHovered
} from '../../actions';
import AudioMuteButton from '../AudioMuteButton';
import HangupButton from '../HangupButton';
import OverflowMenuButton from './OverflowMenuButton';
import OverflowMenuItem from './OverflowMenuItem';
import OverflowMenuLiveStreamingItem from './OverflowMenuLiveStreamingItem';
import OverflowMenuProfileItem from './OverflowMenuProfileItem';
import ToolbarButton from './ToolbarButton';
import VideoMuteButton from '../VideoMuteButton';

/**
 * The type of the React {@code Component} props of {@link Toolbox}.
 */
type Props = {

    /**
     * Whether or not the chat feature is currently displayed.
     */
    _chatOpen: boolean,

    /**
     * The {@code JitsiConference} for the current conference.
     */
    _conference: Object,

    /**
     * The tooltip key to use when screensharing is disabled. Or undefined
     * if non to be shown and the button to be hidden.
     */
    _desktopSharingDisabledTooltipKey: boolean,

    /**
     * Whether or not screensharing is initialized.
     */
    _desktopSharingEnabled: boolean,

    /**
     * Whether or not a dialog is displayed.
     */
    _dialog: boolean,

    /**
     * Whether or not the local participant is currently editing a document.
     */
    _editingDocument: boolean,

    /**
     * Whether or not collaborative document editing is enabled.
     */
    _etherpadInitialized: boolean,

    /**
     * Whether or not call feedback can be sent.
     */
    _feedbackConfigured: boolean,

    /**
     * The tooltip key to use when file recording is disabled. Or undefined
     * if non to be shown and the button to be hidden.
     */
    _fileRecordingsDisabledTooltipKey: boolean,

    /**
     * Whether or not the file recording feature is enabled for use.
     */
    _fileRecordingsEnabled: boolean,

    /**
     * The current file recording session, if any.
     */
    _fileRecordingSession: Object,

    /**
     * Whether or not the app is currently in full screen.
     */
    _fullScreen: boolean,

    /**
     * Whether or not invite should be hidden, regardless of feature
     * availability.
     */
    _hideInviteButton: boolean,

    /**
     * Whether or not the current user is logged in through a JWT.
     */
    _isGuest: boolean,

    /**
     * The tooltip key to use when live streaming is disabled. Or undefined
     * if non to be shown and the button to be hidden.
     */
    _liveStreamingDisabledTooltipKey: boolean,

    /**
     * Whether or not the live streaming feature is enabled for use.
     */
    _liveStreamingEnabled: boolean,

    /**
     * The current live streaming session, if any.
     */
    _liveStreamingSession: ?Object,

    /**
     * The ID of the local participant.
     */
    _localParticipantID: String,

    /**
     * Whether or not the overflow menu is visible.
     */
    _overflowMenuVisible: boolean,

    /**
     * Whether or not the local participant's hand is raised.
     */
    _raisedHand: boolean,

    /**
     * Whether or not the local participant is screensharing.
     */
    _screensharing: boolean,

    /**
     * Whether or not the local participant is sharing a YouTube video.
     */
    _sharingVideo: boolean,

    /**
     * Flag showing whether toolbar is visible.
     */
    _visible: boolean,

    /**
     * Set with the buttons which this Toolbox should display.
     */
    _visibleButtons: Set<string>,

    /**
     * Invoked to active other features of the app.
     */
    dispatch: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

declare var APP: Object;
declare var interfaceConfig: Object;

/**
 * Implements the conference toolbox on React/Web.
 *
 * @extends Component
 */
class Toolbox extends Component<Props> {
    /**
     * Initializes a new {@code Toolbox} instance.
     *
     * @param {Props} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onMouseOut = this._onMouseOut.bind(this);
        this._onMouseOver = this._onMouseOver.bind(this);
        this._onSetOverflowVisible = this._onSetOverflowVisible.bind(this);

        this._onShortcutToggleChat = this._onShortcutToggleChat.bind(this);
        this._onShortcutToggleFullScreen
            = this._onShortcutToggleFullScreen.bind(this);
        this._onShortcutToggleRaiseHand
            = this._onShortcutToggleRaiseHand.bind(this);
        this._onShortcutToggleScreenshare
            = this._onShortcutToggleScreenshare.bind(this);

        this._onToolbarOpenFeedback
            = this._onToolbarOpenFeedback.bind(this);
        this._onToolbarOpenInvite = this._onToolbarOpenInvite.bind(this);
        this._onToolbarOpenKeyboardShortcuts
            = this._onToolbarOpenKeyboardShortcuts.bind(this);
        this._onToolbarOpenSpeakerStats
            = this._onToolbarOpenSpeakerStats.bind(this);
        this._onToolbarOpenVideoQuality
            = this._onToolbarOpenVideoQuality.bind(this);
        this._onToolbarToggleChat = this._onToolbarToggleChat.bind(this);
        this._onToolbarToggleEtherpad
            = this._onToolbarToggleEtherpad.bind(this);
        this._onToolbarToggleFullScreen
            = this._onToolbarToggleFullScreen.bind(this);
        this._onToolbarToggleLiveStreaming
            = this._onToolbarToggleLiveStreaming.bind(this);
        this._onToolbarToggleProfile
            = this._onToolbarToggleProfile.bind(this);
        this._onToolbarToggleRaiseHand
            = this._onToolbarToggleRaiseHand.bind(this);
        this._onToolbarToggleRecording
            = this._onToolbarToggleRecording.bind(this);
        this._onToolbarToggleScreenshare
            = this._onToolbarToggleScreenshare.bind(this);
        this._onToolbarToggleSharedVideo
            = this._onToolbarToggleSharedVideo.bind(this);
    }

    /**
     * Sets keyboard shortcuts for to trigger ToolbarButtons actions.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        const KEYBOARD_SHORTCUTS = [
            this._shouldShowButton('chat') && {
                character: 'C',
                exec: this._onShortcutToggleChat,
                helpDescription: 'keyboardShortcuts.toggleChat'
            },
            this._shouldShowButton('desktop') && {
                character: 'D',
                exec: this._onShortcutToggleScreenshare,
                helpDescription: 'keyboardShortcuts.toggleScreensharing'
            },
            this._shouldShowButton('raisehand') && {
                character: 'R',
                exec: this._onShortcutToggleRaiseHand,
                helpDescription: 'keyboardShortcuts.raiseHand'
            },
            this._shouldShowButton('fullscreen') && {
                character: 'S',
                exec: this._onShortcutToggleFullScreen,
                helpDescription: 'keyboardShortcuts.fullScreen'
            }
        ];

        KEYBOARD_SHORTCUTS.forEach(shortcut => {
            if (typeof shortcut === 'object') {
                APP.keyboardshortcut.registerShortcut(
                    shortcut.character,
                    null,
                    shortcut.exec,
                    shortcut.helpDescription);
            }
        });
    }

    /**
     * Update the visibility of the {@code OverflowMenuButton}.
     *
     * @inheritdoc
     */
    componentWillReceiveProps(nextProps) {
        // Ensure the dialog is closed when the toolbox becomes hidden.
        if (this.props._overflowMenuVisible && !nextProps._visible) {
            this._onSetOverflowVisible(false);
        }

        if (this.props._overflowMenuVisible
            && !this.props._dialog
            && nextProps._dialog) {
            this._onSetOverflowVisible(false);
            this.props.dispatch(setToolbarHovered(false));
        }
    }

    /**
     * Removes keyboard shortcuts registered by this component.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        [ 'C', 'D', 'R', 'S' ].forEach(letter =>
            APP.keyboardshortcut.unregisterShortcut(letter));
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _chatOpen,
            _hideInviteButton,
            _overflowMenuVisible,
            _raisedHand,
            _visible,
            _visibleButtons,
            t
        } = this.props;
        const rootClassNames = `new-toolbox ${_visible ? 'visible' : ''} ${
            _visibleButtons.size ? '' : 'no-buttons'}`;
        const overflowMenuContent = this._renderOverflowMenuContent();
        const overflowHasItems = Boolean(overflowMenuContent.filter(
            child => child).length);
        const toolbarAccLabel = 'toolbar.accessibilityLabel.moreActionsMenu';

        return (
            <div
                className = { rootClassNames }
                id = 'new-toolbox'
                onMouseOut = { this._onMouseOut }
                onMouseOver = { this._onMouseOver }>
                <div className = 'button-group-left'>
                    { this._shouldShowButton('desktop')
                        && this._renderDesktopSharingButton() }
                    { this._shouldShowButton('raisehand')
                        && <ToolbarButton
                            accessibilityLabel =
                                { t('toolbar.accessibilityLabel.raiseHand') }
                            iconName = { _raisedHand
                                ? 'icon-raised-hand toggled'
                                : 'icon-raised-hand' }
                            onClick = { this._onToolbarToggleRaiseHand }
                            tooltip = { t('toolbar.raiseHand') } /> }
                    { this._shouldShowButton('chat')
                        && <div className = 'toolbar-button-with-badge'>
                            <ToolbarButton
                                accessibilityLabel =
                                    { t('toolbar.accessibilityLabel.chat') }
                                iconName = { _chatOpen
                                    ? 'icon-chat toggled'
                                    : 'icon-chat' }
                                onClick = { this._onToolbarToggleChat }
                                tooltip = { t('toolbar.chat') } />
                            <ChatCounter />
                        </div> }
                </div>
                <div className = 'button-group-center'>
                    <AudioMuteButton
                        visible = { this._shouldShowButton('microphone') } />
                    <HangupButton
                        visible = { this._shouldShowButton('hangup') } />
                    <VideoMuteButton
                        visible = { this._shouldShowButton('camera') } />
                </div>
                <div className = 'button-group-right'>
                    { this._shouldShowButton('invite')
                        && !_hideInviteButton
                        && <ToolbarButton
                            accessibilityLabel =
                                { t('toolbar.accessibilityLabel.invite') }
                            iconName = 'icon-add'
                            onClick = { this._onToolbarOpenInvite }
                            tooltip = { t('toolbar.invite') } /> }
                    { this._shouldShowButton('info') && <InfoDialogButton /> }
                    { overflowHasItems
                        && <OverflowMenuButton
                            isOpen = { _overflowMenuVisible }
                            onVisibilityChange = { this._onSetOverflowVisible }>
                            <ul
                                aria-label = { t(toolbarAccLabel) }
                                className = 'overflow-menu'>
                                { overflowMenuContent }
                            </ul>
                        </OverflowMenuButton> }
                </div>
            </div>
        );
    }

    /**
     * Callback invoked to display {@code FeedbackDialog}.
     *
     * @private
     * @returns {void}
     */
    _doOpenFeedback() {
        const { _conference } = this.props;

        this.props.dispatch(openFeedbackDialog(_conference));
    }

    /**
     * Dispatches an action to display {@code KeyboardShortcuts}.
     *
     * @private
     * @returns {void}
     */
    _doOpenKeyboardShorcuts() {
        this.props.dispatch(openKeyboardShortcutsDialog());
    }

    /**
     * Callback invoked to display {@code SpeakerStats}.
     *
     * @private
     * @returns {void}
     */
    _doOpenSpeakerStats() {
        this.props.dispatch(openDialog(SpeakerStats, {
            conference: this.props._conference
        }));
    }

    /**
     * Dispatches an action to toggle the video quality dialog.
     *
     * @private
     * @returns {void}
     */
    _doOpenVideoQuality() {
        this.props.dispatch(openDialog(VideoQualityDialog));
    }

    /**
     * Dispatches an action to toggle the display of chat.
     *
     * @private
     * @returns {void}
     */
    _doToggleChat() {
        this.props.dispatch(toggleChat());
    }

    /**
     * Dispatches an action to show or hide document editing.
     *
     * @private
     * @returns {void}
     */
    _doToggleEtherpad() {
        this.props.dispatch(toggleDocument());
    }

    /**
     * Dispatches an action to toggle screensharing.
     *
     * @private
     * @returns {void}
     */
    _doToggleFullScreen() {
        const fullScreen = !this.props._fullScreen;

        this.props.dispatch(setFullScreen(fullScreen));
    }

    /**
     * Dispatches an action to show a dialog for starting or stopping a live
     * streaming session.
     *
     * @private
     * @returns {void}
     */
    _doToggleLiveStreaming() {
        const { _liveStreamingSession } = this.props;
        const dialogToDisplay = _liveStreamingSession
            ? StopLiveStreamDialog : StartLiveStreamDialog;

        this.props.dispatch(
            openDialog(dialogToDisplay, { session: _liveStreamingSession }));
    }

    /**
     * Dispatches an action to show or hide the profile edit panel.
     *
     * @private
     * @returns {void}
     */
    _doToggleProfile() {
        this.props.dispatch(toggleProfile());
    }

    /**
     * Dispatches an action to toggle the local participant's raised hand state.
     *
     * @private
     * @returns {void}
     */
    _doToggleRaiseHand() {
        const { _localParticipantID, _raisedHand } = this.props;

        this.props.dispatch(participantUpdated({
            // XXX Only the local participant is allowed to update without
            // stating the JitsiConference instance (i.e. participant property
            // `conference` for a remote participant) because the local
            // participant is uniquely identified by the very fact that there is
            // only one local participant.

            id: _localParticipantID,
            local: true,
            raisedHand: !_raisedHand
        }));
    }

    /**
     * Dispatches an action to toggle recording.
     *
     * @private
     * @returns {void}
     */
    _doToggleRecording() {
        const { _fileRecordingSession } = this.props;
        const dialog = _fileRecordingSession
            ? StopRecordingDialog : StartRecordingDialog;

        this.props.dispatch(
            openDialog(dialog, { session: _fileRecordingSession }));
    }

    /**
     * Dispatches an action to toggle screensharing.
     *
     * @private
     * @returns {void}
     */
    _doToggleScreenshare() {
        if (this.props._desktopSharingEnabled) {
            this.props.dispatch(toggleScreensharing());
        }
    }

    /**
     * Dispatches an action to toggle YouTube video sharing.
     *
     * @private
     * @returns {void}
     */
    _doToggleSharedVideo() {
        this.props.dispatch(toggleSharedVideo());
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
        this.props.dispatch(setOverflowMenuVisible(visible));
    }

    _onShortcutToggleChat: () => void;

    /**
     * Creates an analytics keyboard shortcut event and dispatches an action for
     * toggling the display of chat.
     *
     * @private
     * @returns {void}
     */
    _onShortcutToggleChat() {
        sendAnalytics(createShortcutEvent(
            'toggle.chat',
            {
                enable: !this.props._chatOpen
            }));

        this._doToggleChat();
    }

    _onShortcutToggleFullScreen: () => void;

    /**
     * Creates an analytics keyboard shortcut event and dispatches an action for
     * toggling full screen mode.
     *
     * @private
     * @returns {void}
     */
    _onShortcutToggleFullScreen() {
        sendAnalytics(createShortcutEvent(
            'toggle.fullscreen',
            {
                enable: !this.props._fullScreen
            }));

        this._doToggleFullScreen();
    }

    _onShortcutToggleRaiseHand: () => void;

    /**
     * Creates an analytics keyboard shortcut event and dispatches an action for
     * toggling raise hand.
     *
     * @private
     * @returns {void}
     */
    _onShortcutToggleRaiseHand() {
        sendAnalytics(createShortcutEvent(
            'toggle.raise.hand',
            ACTION_SHORTCUT_TRIGGERED,
            { enable: !this.props._raisedHand }));

        this._doToggleRaiseHand();
    }

    _onShortcutToggleScreenshare: () => void;

    /**
     * Creates an analytics keyboard shortcut event and dispatches an action for
     * toggling screensharing.
     *
     * @private
     * @returns {void}
     */
    _onShortcutToggleScreenshare() {
        sendAnalytics(createToolbarEvent(
            'screen.sharing',
            {
                enable: !this.props._screensharing
            }));

        this._doToggleScreenshare();
    }

    _onToolbarOpenFeedback: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for toggling
     * display of feedback.
     *
     * @private
     * @returns {void}
     */
    _onToolbarOpenFeedback() {
        sendAnalytics(createToolbarEvent('feedback'));

        this._doOpenFeedback();
    }

    _onToolbarOpenInvite: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for opening
     * the modal for inviting people directly into the conference.
     *
     * @private
     * @returns {void}
     */
    _onToolbarOpenInvite() {
        sendAnalytics(createToolbarEvent('invite'));
        this.props.dispatch(beginAddPeople());
    }

    _onToolbarOpenKeyboardShortcuts: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for opening
     * the modal for showing available keyboard shortcuts.
     *
     * @private
     * @returns {void}
     */
    _onToolbarOpenKeyboardShortcuts() {
        sendAnalytics(createToolbarEvent('shortcuts'));

        this._doOpenKeyboardShorcuts();
    }

    _onToolbarOpenSpeakerStats: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for opening
     * the speaker stats modal.
     *
     * @private
     * @returns {void}
     */
    _onToolbarOpenSpeakerStats() {
        sendAnalytics(createToolbarEvent('speaker.stats'));

        this._doOpenSpeakerStats();
    }

    _onToolbarOpenVideoQuality: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for toggling
     * open the video quality dialog.
     *
     * @private
     * @returns {void}
     */
    _onToolbarOpenVideoQuality() {
        sendAnalytics(createToolbarEvent('video.quality'));

        this._doOpenVideoQuality();
    }

    _onToolbarToggleChat: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for toggling
     * the display of chat.
     *
     * @private
     * @returns {void}
     */
    _onToolbarToggleChat() {
        sendAnalytics(createToolbarEvent(
            'toggle.chat',
            {
                enable: !this.props._chatOpen
            }));

        this._doToggleChat();
    }

    _onToolbarToggleEtherpad: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for toggling
     * the display of document editing.
     *
     * @private
     * @returns {void}
     */
    _onToolbarToggleEtherpad() {
        sendAnalytics(createToolbarEvent(
            'toggle.etherpad',
            {
                enable: !this.props._editingDocument
            }));

        this._doToggleEtherpad();
    }

    _onToolbarToggleFullScreen: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for toggling
     * full screen mode.
     *
     * @private
     * @returns {void}
     */
    _onToolbarToggleFullScreen() {
        sendAnalytics(createToolbarEvent(
            'toggle.fullscreen',
                {
                    enable: !this.props._fullScreen
                }));

        this._doToggleFullScreen();
    }

    _onToolbarToggleLiveStreaming: () => void;

    /**
     * Starts the process for enabling or disabling live streaming.
     *
     * @private
     * @returns {void}
     */
    _onToolbarToggleLiveStreaming() {
        sendAnalytics(createToolbarEvent(
            'livestreaming.button',
            {
                'is_streaming': Boolean(this.props._liveStreamingSession),
                type: JitsiRecordingConstants.mode.STREAM
            }));

        this._doToggleLiveStreaming();
    }

    _onToolbarToggleProfile: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for showing
     * or hiding the profile edit panel.
     *
     * @private
     * @returns {void}
     */
    _onToolbarToggleProfile() {
        sendAnalytics(createToolbarEvent('profile'));

        this._doToggleProfile();
    }

    _onToolbarToggleRaiseHand: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for toggling
     * raise hand.
     *
     * @private
     * @returns {void}
     */
    _onToolbarToggleRaiseHand() {
        sendAnalytics(createToolbarEvent(
            'raise.hand',
            { enable: !this.props._raisedHand }));

        this._doToggleRaiseHand();
    }

    _onToolbarToggleRecording: () => void;

    /**
     * Dispatches an action to toggle recording.
     *
     * @private
     * @returns {void}
     */
    _onToolbarToggleRecording() {
        sendAnalytics(createToolbarEvent(
            'recording.button',
            {
                'is_recording': Boolean(this.props._fileRecordingSession),
                type: JitsiRecordingConstants.mode.FILE
            }));

        this._doToggleRecording();
    }

    _onToolbarToggleScreenshare: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for toggling
     * screensharing.
     *
     * @private
     * @returns {void}
     */
    _onToolbarToggleScreenshare() {
        if (!this.props._desktopSharingEnabled) {
            return;
        }

        sendAnalytics(createShortcutEvent(
            'toggle.screen.sharing',
            ACTION_SHORTCUT_TRIGGERED,
            { enable: !this.props._screensharing }));

        this._doToggleScreenshare();
    }

    _onToolbarToggleSharedVideo: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for toggling
     * the sharing of a YouTube video.
     *
     * @private
     * @returns {void}
     */
    _onToolbarToggleSharedVideo() {
        sendAnalytics(createToolbarEvent('shared.video.toggled',
            {
                enable: !this.props._sharingVideo
            }));

        this._doToggleSharedVideo();
    }

    /**
     * Renders a button for toggleing screen sharing.
     *
     * @private
     * @returns {ReactElement|null}
     */
    _renderDesktopSharingButton() {
        const {
            _desktopSharingEnabled,
            _desktopSharingDisabledTooltipKey,
            _screensharing,
            t
        } = this.props;

        const visible
            = _desktopSharingEnabled || _desktopSharingDisabledTooltipKey;

        if (!visible) {
            return null;
        }

        const classNames = `icon-share-desktop ${
            _screensharing ? 'toggled' : ''} ${
            _desktopSharingEnabled ? '' : 'disabled'}`;
        const tooltip = t(
            _desktopSharingEnabled
                ? 'dialog.shareYourScreen' : _desktopSharingDisabledTooltipKey);

        return (
            <ToolbarButton
                accessibilityLabel
                    = { t('toolbar.accessibilityLabel.shareYourScreen') }
                iconName = { classNames }
                onClick = { this._onToolbarToggleScreenshare }
                tooltip = { tooltip } />
        );
    }

    /**
     * Renders the list elements of the overflow menu.
     *
     * @private
     * @returns {Array<ReactElement>}
     */
    _renderOverflowMenuContent() {
        const {
            _editingDocument,
            _etherpadInitialized,
            _feedbackConfigured,
            _fileRecordingsDisabledTooltipKey,
            _fileRecordingsEnabled,
            _fullScreen,
            _isGuest,
            _liveStreamingDisabledTooltipKey,
            _liveStreamingEnabled,
            _liveStreamingSession,
            _sharingVideo,
            t
        } = this.props;

        return [
            _isGuest
                && this._shouldShowButton('profile')
                && <OverflowMenuProfileItem
                    key = 'profile'
                    onClick = { this._onToolbarToggleProfile } />,
            this._shouldShowButton('videoquality')
                && <OverflowMenuVideoQualityItem
                    key = 'videoquality'
                    onClick = { this._onToolbarOpenVideoQuality } />,
            this._shouldShowButton('fullscreen')
                && <OverflowMenuItem
                    accessibilityLabel =
                        { t('toolbar.accessibilityLabel.fullScreen') }
                    icon = { _fullScreen
                        ? 'icon-exit-full-screen'
                        : 'icon-full-screen' }
                    key = 'fullscreen'
                    onClick = { this._onToolbarToggleFullScreen }
                    text = { _fullScreen
                        ? t('toolbar.exitFullScreen')
                        : t('toolbar.enterFullScreen') } />,
            (_liveStreamingEnabled || _liveStreamingDisabledTooltipKey)
                && this._shouldShowButton('livestreaming')
                && <OverflowMenuLiveStreamingItem
                    disabled = { !_liveStreamingEnabled }
                    key = 'livestreaming'
                    onClick = { this._onToolbarToggleLiveStreaming }
                    session = { _liveStreamingSession }
                    tooltip = { t(_liveStreamingDisabledTooltipKey) } />,
            (_fileRecordingsEnabled || _fileRecordingsDisabledTooltipKey)
                && this._shouldShowButton('recording')
                && this._renderRecordingButton(),
            this._shouldShowButton('sharedvideo')
                && <OverflowMenuItem
                    accessibilityLabel =
                        { t('toolbar.accessibilityLabel.sharedvideo') }
                    icon = 'icon-shared-video'
                    key = 'sharedvideo'
                    onClick = { this._onToolbarToggleSharedVideo }
                    text = { _sharingVideo
                        ? t('toolbar.stopSharedVideo')
                        : t('toolbar.sharedvideo') } />,
            this._shouldShowButton('etherpad')
                && _etherpadInitialized
                && <OverflowMenuItem
                    accessibilityLabel =
                        { t('toolbar.accessibilityLabel.document') }
                    icon = 'icon-share-doc'
                    key = 'etherpad'
                    onClick = { this._onToolbarToggleEtherpad }
                    text = { _editingDocument
                        ? t('toolbar.documentClose')
                        : t('toolbar.documentOpen') } />,
            <SettingsButton
                key = 'settings'
                showLabel = { true }
                visible = { this._shouldShowButton('settings') } />,
            this._shouldShowButton('stats')
                && <OverflowMenuItem
                    accessibilityLabel =
                        { t('toolbar.accessibilityLabel.speakerStats') }
                    icon = 'icon-presentation'
                    key = 'stats'
                    onClick = { this._onToolbarOpenSpeakerStats }
                    text = { t('toolbar.speakerStats') } />,
            this._shouldShowButton('feedback')
                && _feedbackConfigured
                && <OverflowMenuItem
                    accessibilityLabel =
                        { t('toolbar.accessibilityLabel.feedback') }
                    icon = 'icon-feedback'
                    key = 'feedback'
                    onClick = { this._onToolbarOpenFeedback }
                    text = { t('toolbar.feedback') } />,
            this._shouldShowButton('shortcuts')
                && <OverflowMenuItem
                    accessibilityLabel =
                        { t('toolbar.accessibilityLabel.shortcuts') }
                    icon = 'icon-open_in_new'
                    key = 'shortcuts'
                    onClick = { this._onToolbarOpenKeyboardShortcuts }
                    text = { t('toolbar.shortcuts') } />
        ];
    }

    /**
     * Renders an {@code OverflowMenuItem} to start or stop recording of the
     * current conference.
     *
     * @private
     * @returns {ReactElement|null}
     */
    _renderRecordingButton() {
        const {
            _fileRecordingSession,
            _fileRecordingsDisabledTooltipKey,
            _fileRecordingsEnabled,
            t } = this.props;

        const translationKey = _fileRecordingSession
            ? 'dialog.stopRecording'
            : 'dialog.startRecording';

        return (
            <OverflowMenuItem
                accessibilityLabel =
                    { t('toolbar.accessibilityLabel.recording') }
                disabled = { !_fileRecordingsEnabled }
                icon = 'icon-camera-take-picture'
                key = 'recording'
                onClick = { this._onToolbarToggleRecording }
                text = { t(translationKey) }
                tooltip = { t(_fileRecordingsDisabledTooltipKey) } />
        );
    }

    _shouldShowButton: (string) => boolean;

    /**
     * Returns if a button name has been explicitly configured to be displayed.
     *
     * @param {string} buttonName - The name of the button, as expected in
     * {@link intefaceConfig}.
     * @private
     * @returns {boolean} True if the button should be displayed.
     */
    _shouldShowButton(buttonName) {
        return this.props._visibleButtons.has(buttonName);
    }
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
    const { conference } = state['features/base/conference'];
    let { desktopSharingEnabled } = state['features/base/conference'];
    const {
        callStatsID,
        iAmRecorder
    } = state['features/base/config'];
    let {
        fileRecordingsEnabled,
        liveStreamingEnabled
    } = state['features/base/config'];
    const sharedVideoStatus = state['features/shared-video'].status;
    const { current } = state['features/side-panel'];
    const {
        alwaysVisible,
        fullScreen,
        overflowMenuVisible,
        timeoutID,
        visible
    } = state['features/toolbox'];
    const localParticipant = getLocalParticipant(state);
    const localVideo = getLocalVideoTrack(state['features/base/tracks']);
    const addPeopleEnabled = isAddPeopleEnabled(state);
    const dialOutEnabled = isDialOutEnabled(state);

    let desktopSharingDisabledTooltipKey;
    let fileRecordingsDisabledTooltipKey;
    let liveStreamingDisabledTooltipKey;

    fileRecordingsEnabled
        = isLocalParticipantModerator(state) && fileRecordingsEnabled;
    liveStreamingEnabled
        = isLocalParticipantModerator(state) && liveStreamingEnabled;

    if (state['features/base/config'].enableFeaturesBasedOnToken) {
        // we enable desktop sharing if any participant already have this
        // feature enabled
        desktopSharingEnabled = getParticipants(state)
            .find(({ features = {} }) =>
                String(features['screen-sharing']) === 'true') !== undefined;

        // we want to show button and tooltip
        if (state['features/base/jwt'].isGuest) {
            desktopSharingDisabledTooltipKey
                = 'dialog.shareYourScreenDisabledForGuest';
        } else {
            desktopSharingDisabledTooltipKey
                = 'dialog.shareYourScreenDisabled';
        }

        // we enable recording if the local participant have this
        // feature enabled
        const { features = {} } = localParticipant;
        const { isGuest } = state['features/base/jwt'];

        fileRecordingsEnabled
            = fileRecordingsEnabled && String(features.recording) === 'true';

        // if the feature is disabled on purpose, do no show it, no tooltip
        if (!fileRecordingsEnabled
            && String(features.recording) !== 'disabled') {
            // button and tooltip
            if (isGuest) {
                fileRecordingsDisabledTooltipKey
                    = 'dialog.recordingDisabledForGuestTooltip';
            } else {
                fileRecordingsDisabledTooltipKey
                    = 'dialog.recordingDisabledTooltip';
            }
        }

        liveStreamingEnabled
            = liveStreamingEnabled && String(features.livestreaming) === 'true';

        // if the feature is disabled on purpose, do no show it, no tooltip
        if (!liveStreamingEnabled
            && String(features.livestreaming) !== 'disabled') {
            // button and tooltip
            if (isGuest) {
                liveStreamingDisabledTooltipKey
                    = 'dialog.liveStreamingDisabledForGuestTooltip';
            } else {
                liveStreamingDisabledTooltipKey
                    = 'dialog.liveStreamingDisabledTooltip';
            }
        }
    }

    return {
        _chatOpen: current === 'chat_container',
        _conference: conference,
        _desktopSharingEnabled: desktopSharingEnabled,
        _desktopSharingDisabledTooltipKey: desktopSharingDisabledTooltipKey,
        _dialog: Boolean(state['features/base/dialog'].component),
        _editingDocument: Boolean(state['features/etherpad'].editing),
        _etherpadInitialized: Boolean(state['features/etherpad'].initialized),
        _feedbackConfigured: Boolean(callStatsID),
        _hideInviteButton:
            iAmRecorder || (!addPeopleEnabled && !dialOutEnabled),
        _isGuest: state['features/base/jwt'].isGuest,
        _fileRecordingsDisabledTooltipKey: fileRecordingsDisabledTooltipKey,
        _fileRecordingsEnabled: fileRecordingsEnabled,
        _fileRecordingSession:
            getActiveSession(state, JitsiRecordingConstants.mode.FILE),
        _fullScreen: fullScreen,
        _liveStreamingDisabledTooltipKey: liveStreamingDisabledTooltipKey,
        _liveStreamingEnabled: liveStreamingEnabled,
        _liveStreamingSession:
             getActiveSession(state, JitsiRecordingConstants.mode.STREAM),
        _localParticipantID: localParticipant.id,
        _overflowMenuVisible: overflowMenuVisible,
        _raisedHand: localParticipant.raisedHand,
        _screensharing: localVideo && localVideo.videoType === 'desktop',
        _sharingVideo: sharedVideoStatus === 'playing'
            || sharedVideoStatus === 'start'
            || sharedVideoStatus === 'pause',
        _visible: Boolean(timeoutID || visible || alwaysVisible),

        // XXX: We are not currently using state here, but in the future, when
        // interfaceConfig is part of redux we will.
        _visibleButtons: new Set(interfaceConfig.TOOLBAR_BUTTONS)
    };
}

export default translate(connect(_mapStateToProps)(Toolbox));
