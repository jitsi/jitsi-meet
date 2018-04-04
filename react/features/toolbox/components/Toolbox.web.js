// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
    ACTION_SHORTCUT_TRIGGERED,
    createShortcutEvent,
    createToolbarEvent,
    sendAnalytics
} from '../../analytics';
import { openDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import {
    PARTICIPANT_ROLE,
    getLocalParticipant,
    participantUpdated
} from '../../base/participants';
import { getLocalVideoTrack, toggleScreensharing } from '../../base/tracks';
import { ChatCounter } from '../../chat';
import { openDeviceSelectionDialog } from '../../device-selection';
import { toggleDocument } from '../../etherpad';
import { openFeedbackDialog } from '../../feedback';
import { AddPeopleDialog, InfoDialogButton } from '../../invite';
import { openKeyboardShortcutsDialog } from '../../keyboard-shortcuts';
import { RECORDING_TYPES, toggleRecording } from '../../recording';
import { toggleSharedVideo } from '../../shared-video';
import { toggleChat, toggleProfile, toggleSettings } from '../../side-panel';
import { SpeakerStats } from '../../speaker-stats';
import { VideoQualityDialog } from '../../video-quality';

import { setFullScreen, setToolbarHovered } from '../actions';

import OverflowMenuButton from './OverflowMenuButton';
import OverflowMenuItem from './OverflowMenuItem';
import OverflowMenuProfileItem from './OverflowMenuProfileItem';
import ToolbarButtonV2 from './ToolbarButtonV2';
import { AudioMuteButton, HangupButton, VideoMuteButton } from './buttons';

type Props = {

    /**
     * Whether or not the feature for adding people directly into the call
     * is enabled.
     */
    _addPeopleAvailable: boolean,

    /**
     * Whether or not the chat feature is currently displayed.
     */
    _chatOpen: boolean,

    /**
     * The {@code JitsiConference} for the current conference.
     */
    _conference: Object,

    /**
     * Whether or not desktopsharing was explicitly configured to be disabled.
     */
    _desktopSharingDisabledByConfig: boolean,

    /**
     * Whether or not screensharing is initialized.
     */
    _desktopSharingEnabled: boolean,

    /**
     * Whether or not the feature for telephony to dial out to a number is
     * enabled.
     */
    _dialOutAvailable: boolean,

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
     * Whether or not the app is currently in full screen.
     */
    _fullScreen: boolean,

    /**
     * Whether or not invite should be hidden, regardless of feature
     * availability.
     */
    _hideInviteButton: boolean,

    /**
     * Whether or not the conference is currently being recorded by the local
     * participant.
     */
    _isRecording: boolean,

    /**
     * The ID of the local participant.
     */
    _localParticipantID: String,

    /**
     * Whether or not the local participant's hand is raised.
     */
    _raisedHand: boolean,

    /**
     * Whether or not the recording feature is enabled for use.
     */
    _recordingEnabled: boolean,

    /**
     * Whether the recording feature is live streaming (jibri) or is file
     * recording (jirecon).
     */
    _recordingType: String,

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
     * Invoked to active other features of the app.
     */
    dispatch: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
}

type State = {

    /**
     * Whether or not the overflow menu is visible.
     */
    showOverflowMenu: boolean
}

declare var APP: Object;
declare var interfaceConfig: Object;

/**
 * Implements the conference toolbox on React/Web.
 *
 * @extends Component
 */
class Toolbox extends Component<Props, State> {
    _visibleButtons: Object;

    state = {
        showOverflowMenu: false
    }

    /**
     * Initializes a new {@code Toolbox} instance.
     *
     * @param {Props} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this._visibleButtons = new Set(interfaceConfig.TOOLBAR_BUTTONS);

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
        this._onToolbarToggleProfile
            = this._onToolbarToggleProfile.bind(this);
        this._onToolbarToggleRaiseHand
            = this._onToolbarToggleRaiseHand.bind(this);
        this._onToolbarToggleRecording
            = this._onToolbarToggleRecording.bind(this);
        this._onToolbarToggleScreenshare
            = this._onToolbarToggleScreenshare.bind(this);
        this._onToolbarToggleSettings
            = this._onToolbarToggleSettings.bind(this);
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
        if (this.state.showOverflowMenu && !nextProps._visible) {
            this._onSetOverflowVisible(false);
        }

        if (this.state.showOverflowMenu
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
            _raisedHand,
            _visible,
            t
        } = this.props;
        const rootClassNames = `new-toolbox ${_visible ? 'visible' : ''} ${
            this._visibleButtons.size ? '' : 'no-buttons'}`;
        const overflowMenuContent = this._renderOverflowMenuContent();
        const overflowHasItems = Boolean(overflowMenuContent.filter(
            child => child).length);

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
                        && <ToolbarButtonV2
                            accessibilityLabel = 'Raised hand'
                            iconName = { _raisedHand
                                ? 'icon-raised-hand toggled'
                                : 'icon-raised-hand' }
                            onClick = { this._onToolbarToggleRaiseHand }
                            tooltip = { t('toolbar.raiseHand') } /> }
                    { this._shouldShowButton('chat')
                        && <div className = 'toolbar-button-with-badge'>
                            <ToolbarButtonV2
                                accessibilityLabel = 'Chat'
                                iconName = { _chatOpen
                                    ? 'icon-chat toggled'
                                    : 'icon-chat' }
                                onClick = { this._onToolbarToggleChat }
                                tooltip = { t('toolbar.chat') } />
                            <ChatCounter />
                        </div> }
                </div>
                <div className = 'button-group-center'>
                    { this._shouldShowButton('microphone')
                        && <AudioMuteButton /> }
                    { this._shouldShowButton('hangup')
                        && <HangupButton /> }
                    { this._shouldShowButton('camera')
                        && <VideoMuteButton /> }
                </div>
                <div className = 'button-group-right'>
                    { this._shouldShowButton('invite')
                        && !_hideInviteButton
                        && <ToolbarButtonV2
                            accessibilityLabel = 'Invite'
                            iconName = 'icon-add'
                            onClick = { this._onToolbarOpenInvite }
                            tooltip = { t('addPeople.title') } /> }
                    { this._shouldShowButton('info') && <InfoDialogButton /> }
                    { overflowHasItems
                        && <OverflowMenuButton
                            isOpen = { this.state.showOverflowMenu }
                            onVisibilityChange = { this._onSetOverflowVisible }>
                            <ul
                                aria-label = 'Overflow menu'
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
     * Opens the dialog for inviting people directly into the conference.
     *
     * @private
     * @returns {void}
     */
    _doOpenInvite() {
        const { _addPeopleAvailable, _dialOutAvailable, dispatch } = this.props;

        if (_addPeopleAvailable || _dialOutAvailable) {
            dispatch(openDialog(AddPeopleDialog, {
                enableAddPeople: _addPeopleAvailable,
                enableDialOut: _dialOutAvailable
            }));
        }
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
        this.props.dispatch(toggleRecording());
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
     * Dispatches an action to toggle display of settings, be it the settings
     * panel or directly to device selection.
     *
     * @private
     * @returns {void}
     */
    _doToggleSettings() {
        if (interfaceConfig.SETTINGS_SECTIONS.length === 1
            && interfaceConfig.SETTINGS_SECTIONS.includes('devices')) {
            this.props.dispatch(openDeviceSelectionDialog());
        } else {
            this.props.dispatch(toggleSettings());
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
        this.setState({ showOverflowMenu: visible });
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

        this._doOpenInvite();
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

    _onToolbarToggleOverflowMenu: () => void;

    /**
     * Callback invoked to change whether the {@code OverflowMenu} is displayed
     * or not.
     *
     * @private
     * @returns {void}
     */
    _onToolbarToggleOverflowMenu() {
        sendAnalytics(createToolbarEvent('overflow'));

        this.setState({ showOverflowMenu: !this.state.showOverflowMenu });
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
        // No analytics handling is added here for the click as this action will
        // exercise the old toolbar UI flow, which includes analytics handling.

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

    _onToolbarToggleSettings: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for toggling
     * settings display.
     *
     * @private
     * @returns {void}
     */
    _onToolbarToggleSettings() {
        sendAnalytics(createToolbarEvent('settings'));

        this._doToggleSettings();
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
            _desktopSharingDisabledByConfig,
            _desktopSharingEnabled,
            _screensharing,
            t
        } = this.props;

        const disabledTooltipText
            = interfaceConfig.DESKTOP_SHARING_BUTTON_DISABLED_TOOLTIP;
        const showDisabledTooltip
            = disabledTooltipText && _desktopSharingDisabledByConfig;
        const visible = _desktopSharingEnabled || showDisabledTooltip;

        if (!visible) {
            return null;
        }

        const classNames = `icon-share-desktop ${
            _screensharing ? 'toggled' : ''} ${
            _desktopSharingEnabled ? '' : 'disabled'}`;
        const tooltip = showDisabledTooltip
            ? disabledTooltipText
            : t('toolbar.sharescreen');

        return (
            <ToolbarButtonV2
                accessibilityLabel = 'Screenshare'
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
            _fullScreen,
            _sharingVideo,
            t
        } = this.props;

        return [
            this._shouldShowButton('profile')
                && <OverflowMenuProfileItem
                    key = 'profile'
                    onClick = { this._onToolbarToggleProfile } />,
            this._shouldShowButton('settings')
                && <OverflowMenuItem
                    accessibilityLabel = 'Settings'
                    icon = 'icon-settings'
                    key = 'settings'
                    onClick = { this._onToolbarToggleSettings }
                    text = { t('toolbar.Settings') } />,
            this._shouldShowButton('sharedvideo')
                && <OverflowMenuItem
                    accessibilityLabel = 'Shared video'
                    icon = 'icon-shared-video'
                    key = 'sharedvideo'
                    onClick = { this._onToolbarToggleSharedVideo }
                    text = { _sharingVideo
                        ? t('toolbar.stopSharedVideo')
                        : t('toolbar.sharedvideo') } />,
            this._shouldShowButton('etherpad')
                && _etherpadInitialized
                && <OverflowMenuItem
                    accessibilityLabel = 'Etherpad'
                    icon = 'icon-share-doc'
                    key = 'etherpad'
                    onClick = { this._onToolbarToggleEtherpad }
                    text = { _editingDocument
                        ? t('toolbar.documentClose')
                        : t('toolbar.documentOpen') } />,
            this._shouldShowButton('fullscreen')
                && <OverflowMenuItem
                    accessibilityLabel = 'Full screen'
                    icon = { _fullScreen
                        ? 'icon-exit-full-screen'
                        : 'icon-full-screen' }
                    key = 'fullscreen'
                    onClick = { this._onToolbarToggleFullScreen }
                    text = { _fullScreen
                        ? t('toolbar.exitFullScreen')
                        : t('toolbar.enterFullScreen') } />,
            this._renderRecordingButton(),
            this._shouldShowButton('videoquality')
                && <OverflowMenuItem
                    accessibilityLabel = 'Call quality'
                    icon = { 'icon-visibility' }
                    key = 'videoquality'
                    onClick = { this._onToolbarOpenVideoQuality }
                    text = { t('toolbar.callQuality') } />,
            this._shouldShowButton('stats')
                && <OverflowMenuItem
                    accessibilityLabel = 'Speaker stats'
                    icon = 'icon-presentation'
                    key = 'stats'
                    onClick = { this._onToolbarOpenSpeakerStats }
                    text = { t('toolbar.speakerStats') } />,
            this._shouldShowButton('feedback')
                && _feedbackConfigured
                && <OverflowMenuItem
                    accessibilityLabel = 'Feedback'
                    icon = 'icon-feedback'
                    key = 'feedback'
                    onClick = { this._onToolbarOpenFeedback }
                    text = { t('toolbar.feedback') } />,
            this._shouldShowButton('shortcuts')
                && <OverflowMenuItem
                    accessibilityLabel = 'Shortcuts'
                    icon = 'icon-open_in_new'
                    key = 'shortcuts'
                    onClick = { this._onToolbarOpenKeyboardShortcuts }
                    text = { t('toolbar.shortcuts') } />
        ];
    }

    /**
     * Renders an {@code OverflowMenuItem} depending on the current recording
     * state.
     *
     * @private
     * @returns {ReactElement|null}
     */
    _renderRecordingButton() {
        const {
            _isRecording,
            _recordingEnabled,
            _recordingType,
            t
        } = this.props;

        if (!_recordingEnabled || !this._shouldShowButton('recording')) {
            return null;
        }

        let translationKey;

        if (_recordingType === RECORDING_TYPES.JIBRI) {
            translationKey = _isRecording
                ? 'dialog.stopLiveStreaming'
                : 'dialog.startLiveStreaming';
        } else {
            translationKey = _isRecording
                ? 'dialog.stopRecording'
                : 'dialog.startRecording';
        }

        return (
            <OverflowMenuItem
                accessibilityLabel = 'Record'
                icon = 'fa fa-play-circle'
                key = 'recording'
                onClick = { this._onToolbarToggleRecording }
                text = { t(translationKey) } />
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
        return this._visibleButtons.has(buttonName);
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
    const {
        conference,
        desktopSharingEnabled
    } = state['features/base/conference'];
    const {
        callStatsID,
        disableDesktopSharing,
        enableRecording,
        enableUserRolesBasedOnToken,
        iAmRecorder
    } = state['features/base/config'];
    const { isGuest } = state['features/base/jwt'];
    const { isRecording, recordingType } = state['features/recording'];
    const sharedVideoStatus = state['features/shared-video'].status;
    const { current } = state['features/side-panel'];
    const {
        alwaysVisible,
        fullScreen,
        timeoutID,
        visible
    } = state['features/toolbox'];
    const localParticipant = getLocalParticipant(state);
    const localVideo = getLocalVideoTrack(state['features/base/tracks']);
    const isModerator = localParticipant.role === PARTICIPANT_ROLE.MODERATOR;
    const isAddPeopleAvailable = !isGuest;
    const isDialOutAvailable
        = isModerator
            && conference && conference.isSIPCallingSupported()
            && (!enableUserRolesBasedOnToken || !isGuest);

    return {
        _addPeopleAvailable: isAddPeopleAvailable,
        _chatOpen: current === 'chat_container',
        _conference: conference,
        _desktopSharingEnabled: desktopSharingEnabled,
        _desktopSharingDisabledByConfig: disableDesktopSharing,
        _dialOutAvailable: isDialOutAvailable,
        _dialog: Boolean(state['features/base/dialog'].component),
        _editingDocument: Boolean(state['features/etherpad'].editing),
        _etherpadInitialized: Boolean(state['features/etherpad'].initialized),
        _feedbackConfigured: Boolean(callStatsID),
        _hideInviteButton: iAmRecorder
            || (!isAddPeopleAvailable && !isDialOutAvailable),
        _isRecording: isRecording,
        _fullScreen: fullScreen,
        _localParticipantID: localParticipant.id,
        _raisedHand: localParticipant.raisedHand,
        _recordingEnabled: isModerator && enableRecording
            && (conference && conference.isRecordingSupported()),
        _recordingType: recordingType,
        _screensharing: localVideo && localVideo.videoType === 'desktop',
        _sharingVideo: sharedVideoStatus === 'playing'
            || sharedVideoStatus === 'start'
            || sharedVideoStatus === 'pause',
        _visible: Boolean(timeoutID || visible || alwaysVisible)
    };
}

export default translate(connect(_mapStateToProps)(Toolbox));
