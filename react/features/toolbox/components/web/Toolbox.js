// @flow

import React, { Component } from 'react';

import {
    ACTION_SHORTCUT_TRIGGERED,
    createShortcutEvent,
    createToolbarEvent,
    sendAnalytics
} from '../../../analytics';
import { openDialog, toggleDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import {
    IconChat,
    IconExitFullScreen,
    IconFeedback,
    IconFullScreen,
    IconInviteMore,
    IconOpenInNew,
    IconPresentation,
    IconRaisedHand,
    IconRec,
    IconShareDesktop,
    IconShareVideo
} from '../../../base/icons';
import {
    getLocalParticipant,
    getParticipants,
    participantUpdated
} from '../../../base/participants';
import { connect, equals } from '../../../base/redux';
import { OverflowMenuItem } from '../../../base/toolbox';
import { getLocalVideoTrack, toggleScreensharing } from '../../../base/tracks';
import { VideoBlurButton } from '../../../blur';
import { ChatCounter, toggleChat } from '../../../chat';
import { E2EEButton } from '../../../e2ee';
import { SharedDocumentButton } from '../../../etherpad';
import { openFeedbackDialog } from '../../../feedback';
import { beginAddPeople } from '../../../invite';
import { openKeyboardShortcutsDialog } from '../../../keyboard-shortcuts';
import {
    LocalRecordingButton,
    LocalRecordingInfoDialog
} from '../../../local-recording';
import {
    LiveStreamButton,
    RecordButton
} from '../../../recording';
import { SecurityDialogButton } from '../../../security';
import {
    SETTINGS_TABS,
    SettingsButton,
    openSettingsDialog
} from '../../../settings';
import { toggleSharedVideo } from '../../../shared-video';
import { SpeakerStats } from '../../../speaker-stats';
import {
    ClosedCaptionButton
} from '../../../subtitles';
import {
    TileViewButton,
    toggleTileView
} from '../../../video-layout';
import {
    OverflowMenuVideoQualityItem,
    VideoQualityDialog
} from '../../../video-quality';
import {
    setFullScreen,
    setOverflowMenuVisible,
    setToolbarHovered
} from '../../actions';
import { isToolboxVisible } from '../../functions';
import DownloadButton from '../DownloadButton';
import HangupButton from '../HangupButton';
import HelpButton from '../HelpButton';

import AudioSettingsButton from './AudioSettingsButton';
import MuteEveryoneButton from './MuteEveryoneButton';
import OverflowMenuButton from './OverflowMenuButton';
import OverflowMenuProfileItem from './OverflowMenuProfileItem';
import ToolbarButton from './ToolbarButton';
import VideoSettingsButton from './VideoSettingsButton';

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
     * Whether or not call feedback can be sent.
     */
    _feedbackConfigured: boolean,

    /**
     * Whether or not the app is currently in full screen.
     */
    _fullScreen: boolean,

    /**
     * Whether or not the tile view is enabled.
     */
    _tileViewEnabled: boolean,

    /**
     * Whether or not the current user is logged in through a JWT.
     */
    _isGuest: boolean,

    /**
     * The ID of the local participant.
     */
    _localParticipantID: String,

    /**
     * The subsection of Redux state for local recording
     */
    _localRecState: Object,

    /**
     * The value for how the conference is locked (or undefined if not locked)
     * as defined by room-lock constants.
     */
    _locked: boolean,

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

/**
 * The type of the React {@code Component} state of {@link Toolbox}.
 */
type State = {

    /**
     * The width of the browser's window.
     */
    windowWidth: number
};

declare var APP: Object;
declare var interfaceConfig: Object;

// XXX: We are not currently using state here, but in the future, when
// interfaceConfig is part of redux we will. This will have to be retrieved from the store.
const visibleButtons = new Set(interfaceConfig.TOOLBAR_BUTTONS);

/**
 * Implements the conference toolbox on React/Web.
 *
 * @extends Component
 */
class Toolbox extends Component<Props, State> {
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
        this._onResize = this._onResize.bind(this);
        this._onSetOverflowVisible = this._onSetOverflowVisible.bind(this);

        this._onShortcutToggleChat = this._onShortcutToggleChat.bind(this);
        this._onShortcutToggleFullScreen = this._onShortcutToggleFullScreen.bind(this);
        this._onShortcutToggleRaiseHand = this._onShortcutToggleRaiseHand.bind(this);
        this._onShortcutToggleScreenshare = this._onShortcutToggleScreenshare.bind(this);
        this._onShortcutToggleVideoQuality = this._onShortcutToggleVideoQuality.bind(this);
        this._onToolbarOpenFeedback = this._onToolbarOpenFeedback.bind(this);
        this._onToolbarOpenInvite = this._onToolbarOpenInvite.bind(this);
        this._onToolbarOpenKeyboardShortcuts = this._onToolbarOpenKeyboardShortcuts.bind(this);
        this._onToolbarOpenSpeakerStats = this._onToolbarOpenSpeakerStats.bind(this);
        this._onToolbarOpenVideoQuality = this._onToolbarOpenVideoQuality.bind(this);
        this._onToolbarToggleChat = this._onToolbarToggleChat.bind(this);
        this._onToolbarToggleFullScreen = this._onToolbarToggleFullScreen.bind(this);
        this._onToolbarToggleProfile = this._onToolbarToggleProfile.bind(this);
        this._onToolbarToggleRaiseHand = this._onToolbarToggleRaiseHand.bind(this);
        this._onToolbarToggleScreenshare = this._onToolbarToggleScreenshare.bind(this);
        this._onToolbarToggleSharedVideo = this._onToolbarToggleSharedVideo.bind(this);
        this._onToolbarOpenLocalRecordingInfoDialog = this._onToolbarOpenLocalRecordingInfoDialog.bind(this);
        this._onShortcutToggleTileView = this._onShortcutToggleTileView.bind(this);

        this.state = {
            windowWidth: window.innerWidth
        };
    }

    /**
     * Sets keyboard shortcuts for to trigger ToolbarButtons actions.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        const KEYBOARD_SHORTCUTS = [
            this._shouldShowButton('videoquality') && {
                character: 'A',
                exec: this._onShortcutToggleVideoQuality,
                helpDescription: 'keyboardShortcuts.videoQuality'
            },
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
            },
            this._shouldShowButton('tileview') && {
                character: 'W',
                exec: this._onShortcutToggleTileView,
                helpDescription: 'toolbar.tileViewToggle'
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

        window.addEventListener('resize', this._onResize);
    }

    /**
     * Update the visibility of the {@code OverflowMenuButton}.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps) {
        // Ensure the dialog is closed when the toolbox becomes hidden.
        if (prevProps._overflowMenuVisible && !this.props._visible) {
            this._onSetOverflowVisible(false);
        }

        if (prevProps._overflowMenuVisible
            && !prevProps._dialog
            && this.props._dialog) {
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
        [ 'A', 'C', 'D', 'R', 'S' ].forEach(letter =>
            APP.keyboardshortcut.unregisterShortcut(letter));

        window.removeEventListener('resize', this._onResize);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _visible, _visibleButtons } = this.props;
        const rootClassNames = `new-toolbox ${_visible ? 'visible' : ''} ${
            _visibleButtons.size ? '' : 'no-buttons'}`;

        return (
            <div
                className = { rootClassNames }
                id = 'new-toolbox'
                onMouseOut = { this._onMouseOut }
                onMouseOver = { this._onMouseOver }>
                <div className = 'toolbox-background' />
                { this._renderToolboxContent() }
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
     * Dispatches an action to open the video quality dialog.
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
        this.props.dispatch(openSettingsDialog(SETTINGS_TABS.PROFILE));
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

    /**
     * Dispatches an action to toggle the video quality dialog.
     *
     * @private
     * @returns {void}
     */
    _doToggleVideoQuality() {
        this.props.dispatch(toggleDialog(VideoQualityDialog));
    }

    /**
     * Dispaches an action to toggle tile view.
     *
     * @private
     * @returns {void}
     */
    _doToggleTileView() {
        this.props.dispatch(toggleTileView());
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

    _onResize: () => void;

    /**
     * A window resize handler used to calculate the number of buttons we can
     * fit in the toolbar.
     *
     * @private
     * @returns {void}
     */
    _onResize() {
        const width = window.innerWidth;

        if (this.state.windowWidth !== width) {
            this.setState({ windowWidth: width });
        }
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

    _onShortcutToggleVideoQuality: () => void;

    /**
    * Creates an analytics keyboard shortcut event and dispatches an action for
    * toggling the display of Video Quality.
    *
    * @private
    * @returns {void}
    */
    _onShortcutToggleVideoQuality() {
        sendAnalytics(createShortcutEvent('video.quality'));

        this._doToggleVideoQuality();
    }

    _onShortcutToggleTileView: () => void;

    /**
     * Dispatches an action for toggling the tile view.
     *
     * @private
     * @returns {void}
     */
    _onShortcutToggleTileView() {
        sendAnalytics(createShortcutEvent(
            'toggle.tileview',
            {
                enable: !this.props._tileViewEnabled
            }));

        this._doToggleTileView();
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

    _onToolbarOpenLocalRecordingInfoDialog: () => void;

    /**
     * Opens the {@code LocalRecordingInfoDialog}.
     *
     * @private
     * @returns {void}
     */
    _onToolbarOpenLocalRecordingInfoDialog() {
        sendAnalytics(createToolbarEvent('local.recording'));

        this.props.dispatch(openDialog(LocalRecordingInfoDialog));
    }

    /**
     * Returns true if the the desktop sharing button should be visible and
     * false otherwise.
     *
     * @returns {boolean}
     */
    _isDesktopSharingButtonVisible() {
        const {
            _desktopSharingEnabled,
            _desktopSharingDisabledTooltipKey
        } = this.props;

        return _desktopSharingEnabled || _desktopSharingDisabledTooltipKey;
    }

    /**
     * Renders a button for toggleing screen sharing.
     *
     * @private
     * @param {boolean} isInOverflowMenu - True if the button is moved to the
     * overflow menu.
     * @returns {ReactElement|null}
     */
    _renderDesktopSharingButton(isInOverflowMenu = false) {
        const {
            _desktopSharingEnabled,
            _desktopSharingDisabledTooltipKey,
            _screensharing,
            t
        } = this.props;

        if (!this._isDesktopSharingButtonVisible()) {
            return null;
        }

        if (isInOverflowMenu) {
            return (
                <OverflowMenuItem
                    accessibilityLabel
                        = { t('toolbar.accessibilityLabel.shareYourScreen') }
                    disabled = { _desktopSharingEnabled }
                    icon = { IconShareDesktop }
                    iconId = 'share-desktop'
                    key = 'desktop'
                    onClick = { this._onToolbarToggleScreenshare }
                    text = {
                        t(`toolbar.${
                            _screensharing
                                ? 'stopScreenSharing' : 'startScreenSharing'}`
                        )
                    } />
            );
        }

        const tooltip = t(
            _desktopSharingEnabled
                ? 'dialog.shareYourScreen' : _desktopSharingDisabledTooltipKey);

        return (
            <ToolbarButton
                accessibilityLabel
                    = { t('toolbar.accessibilityLabel.shareYourScreen') }
                disabled = { !_desktopSharingEnabled }
                icon = { IconShareDesktop }
                onClick = { this._onToolbarToggleScreenshare }
                toggled = { _screensharing }
                tooltip = { tooltip } />
        );
    }

    /**
     * Returns true if the profile button is visible and false otherwise.
     *
     * @returns {boolean}
     */
    _isProfileVisible() {
        return this.props._isGuest && this._shouldShowButton('profile');
    }

    /**
     * Renders the list elements of the overflow menu.
     *
     * @private
     * @returns {Array<ReactElement>}
     */
    _renderOverflowMenuContent() {
        const {
            _feedbackConfigured,
            _fullScreen,
            _screensharing,
            _sharingVideo,
            t
        } = this.props;

        return [
            this._isProfileVisible()
                && <OverflowMenuProfileItem
                    key = 'profile'
                    onClick = { this._onToolbarToggleProfile } />,
            this._shouldShowButton('videoquality')
                && <OverflowMenuVideoQualityItem
                    key = 'videoquality'
                    onClick = { this._onToolbarOpenVideoQuality } />,
            this._shouldShowButton('fullscreen')
                && <OverflowMenuItem
                    accessibilityLabel = { t('toolbar.accessibilityLabel.fullScreen') }
                    icon = { _fullScreen ? IconExitFullScreen : IconFullScreen }
                    key = 'fullscreen'
                    onClick = { this._onToolbarToggleFullScreen }
                    text = { _fullScreen ? t('toolbar.exitFullScreen') : t('toolbar.enterFullScreen') } />,
            <LiveStreamButton
                key = 'livestreaming'
                showLabel = { true } />,
            <RecordButton
                key = 'record'
                showLabel = { true } />,
            this._shouldShowButton('sharedvideo')
                && <OverflowMenuItem
                    accessibilityLabel = { t('toolbar.accessibilityLabel.sharedvideo') }
                    icon = { IconShareVideo }
                    key = 'sharedvideo'
                    onClick = { this._onToolbarToggleSharedVideo }
                    text = { _sharingVideo ? t('toolbar.stopSharedVideo') : t('toolbar.sharedvideo') } />,
            this._shouldShowButton('etherpad')
                && <SharedDocumentButton
                    key = 'etherpad'
                    showLabel = { true } />,
            <VideoBlurButton
                key = 'videobackgroundblur'
                showLabel = { true }
                visible = { this._shouldShowButton('videobackgroundblur') && !_screensharing } />,
            <SettingsButton
                key = 'settings'
                showLabel = { true }
                visible = { this._shouldShowButton('settings') } />,
            <MuteEveryoneButton
                key = 'mute-everyone'
                showLabel = { true }
                visible = { this._shouldShowButton('mute-everyone') } />,
            this._shouldShowButton('stats')
                && <OverflowMenuItem
                    accessibilityLabel = { t('toolbar.accessibilityLabel.speakerStats') }
                    icon = { IconPresentation }
                    key = 'stats'
                    onClick = { this._onToolbarOpenSpeakerStats }
                    text = { t('toolbar.speakerStats') } />,
            this._shouldShowButton('e2ee')
                && <E2EEButton
                    key = 'e2ee'
                    showLabel = { true } />,
            this._shouldShowButton('feedback')
                && _feedbackConfigured
                && <OverflowMenuItem
                    accessibilityLabel = { t('toolbar.accessibilityLabel.feedback') }
                    icon = { IconFeedback }
                    key = 'feedback'
                    onClick = { this._onToolbarOpenFeedback }
                    text = { t('toolbar.feedback') } />,
            this._shouldShowButton('shortcuts')
                && <OverflowMenuItem
                    accessibilityLabel = { t('toolbar.accessibilityLabel.shortcuts') }
                    icon = { IconOpenInNew }
                    key = 'shortcuts'
                    onClick = { this._onToolbarOpenKeyboardShortcuts }
                    text = { t('toolbar.shortcuts') } />,
            this._shouldShowButton('download')
                && <DownloadButton
                    key = 'download'
                    showLabel = { true } />,
            this._shouldShowButton('help')
                && <HelpButton
                    key = 'help'
                    showLabel = { true } />
        ];
    }

    /**
     * Renders a list of buttons that are moved to the overflow menu.
     *
     * @private
     * @param {Array<string>} movedButtons - The names of the buttons to be
     * moved.
     * @returns {Array<ReactElement>}
     */
    _renderMovedButtons(movedButtons) {
        const {
            _chatOpen,
            _raisedHand,
            t
        } = this.props;

        return movedButtons.map(buttonName => {
            switch (buttonName) {
            case 'desktop':
                return this._renderDesktopSharingButton(true);
            case 'raisehand':
                return (
                    <OverflowMenuItem
                        accessibilityLabel =
                            { t('toolbar.accessibilityLabel.raiseHand') }
                        icon = { IconRaisedHand }
                        key = 'raisedHand'
                        onClick = { this._onToolbarToggleRaiseHand }
                        text = {
                            t(`toolbar.${
                                _raisedHand
                                    ? 'lowerYourHand' : 'raiseYourHand'}`
                            )
                        } />
                );
            case 'chat':
                return (
                    <OverflowMenuItem
                        accessibilityLabel =
                            { t('toolbar.accessibilityLabel.chat') }
                        icon = { IconChat }
                        key = 'chat'
                        onClick = { this._onToolbarToggleChat }
                        text = {
                            t(`toolbar.${
                                _chatOpen ? 'closeChat' : 'openChat'}`
                            )
                        } />
                );
            case 'closedcaptions':
                return <ClosedCaptionButton showLabel = { true } />;
            case 'security':
                return (
                    <SecurityDialogButton
                        key = 'security'
                        showLabel = { true } />
                );
            case 'invite':
                return (
                    <OverflowMenuItem
                        accessibilityLabel = { t('toolbar.accessibilityLabel.invite') }
                        icon = { IconInviteMore }
                        key = 'invite'
                        onClick = { this._onToolbarOpenInvite }
                        text = { t('toolbar.invite') } />
                );
            case 'tileview':
                return <TileViewButton showLabel = { true } />;
            case 'localrecording':
                return (
                    <OverflowMenuItem
                        accessibilityLabel = { t('toolbar.accessibilityLabel.localRecording') }
                        icon = { IconRec }
                        key = 'localrecording'
                        onClick = { this._onToolbarOpenLocalRecordingInfoDialog }
                        text = { t('localRecording.dialogTitle') } />
                );
            default:
                return null;
            }
        });
    }

    /**
     * Renders the Audio controlling button.
     *
     * @returns {ReactElement}
     */
    _renderAudioButton() {
        return this._shouldShowButton('microphone')
            ? <AudioSettingsButton
                key = 'asb'
                visible = { true } />
            : null;
    }

    /**
     * Renders the Video controlling button.
     *
     * @returns {ReactElement}
     */
    _renderVideoButton() {
        return this._shouldShowButton('camera')
            ? <VideoSettingsButton
                key = 'vsb'
                visible = { true } />
            : null;
    }

    /**
     * Renders the toolbox content.
     *
     * @returns {Array<ReactElement>}
     */
    _renderToolboxContent() {
        const {
            _chatOpen,
            _overflowMenuVisible,
            _raisedHand,
            t
        } = this.props;
        const overflowMenuContent = this._renderOverflowMenuContent();
        const overflowHasItems = Boolean(overflowMenuContent.filter(child => child).length);
        const toolbarAccLabel = 'toolbar.accessibilityLabel.moreActionsMenu';
        const buttonsLeft = [];
        const buttonsRight = [];

        const maxNumberOfButtonsPerGroup = Math.floor(
            (
                this.state.windowWidth
                    - 168 // the width of the central group by design
                    - 48 // the minimum space between the button groups
            )
            / 56 // the width + padding of a button
            / 2 // divide by the number of groups(left and right group)
        );

        if (this._shouldShowButton('desktop')
                && this._isDesktopSharingButtonVisible()) {
            buttonsLeft.push('desktop');
        }
        if (this._shouldShowButton('raisehand')) {
            buttonsLeft.push('raisehand');
        }
        if (this._shouldShowButton('chat')) {
            buttonsLeft.push('chat');
        }
        if (this._shouldShowButton('closedcaptions')) {
            buttonsLeft.push('closedcaptions');
        }
        if (overflowHasItems) {
            buttonsRight.push('overflowmenu');
        }
        if (this._shouldShowButton('invite')) {
            buttonsRight.push('invite');
        }
        if (this._shouldShowButton('security') || this._shouldShowButton('info')) {
            buttonsRight.push('security');
        }

        if (this._shouldShowButton('tileview')) {
            buttonsRight.push('tileview');
        }
        if (this._shouldShowButton('localrecording')) {
            buttonsRight.push('localrecording');
        }

        const movedButtons = [];

        if (buttonsLeft.length > maxNumberOfButtonsPerGroup) {
            movedButtons.push(...buttonsLeft.splice(
                maxNumberOfButtonsPerGroup,
                buttonsLeft.length - maxNumberOfButtonsPerGroup));
            if (buttonsRight.indexOf('overflowmenu') === -1) {
                buttonsRight.unshift('overflowmenu');
            }
        }

        if (buttonsRight.length > maxNumberOfButtonsPerGroup) {
            if (buttonsRight.indexOf('overflowmenu') === -1) {
                buttonsRight.unshift('overflowmenu');
            }

            let numberOfButtons = maxNumberOfButtonsPerGroup;

            // make sure the more button will be displayed when we move buttons.
            if (numberOfButtons === 0) {
                numberOfButtons++;
            }

            movedButtons.push(...buttonsRight.splice(
                numberOfButtons,
                buttonsRight.length - numberOfButtons));

        }

        overflowMenuContent.splice(
            1, 0, ...this._renderMovedButtons(movedButtons));

        return (
            <div className = 'toolbox-content'>
                <div className = 'button-group-left'>
                    { buttonsLeft.indexOf('desktop') !== -1
                        && this._renderDesktopSharingButton() }
                    { buttonsLeft.indexOf('raisehand') !== -1
                        && <ToolbarButton
                            accessibilityLabel = { t('toolbar.accessibilityLabel.raiseHand') }
                            icon = { IconRaisedHand }
                            onClick = { this._onToolbarToggleRaiseHand }
                            toggled = { _raisedHand }
                            tooltip = { t('toolbar.raiseHand') } /> }
                    { buttonsLeft.indexOf('chat') !== -1
                        && <div className = 'toolbar-button-with-badge'>
                            <ToolbarButton
                                accessibilityLabel = { t('toolbar.accessibilityLabel.chat') }
                                icon = { IconChat }
                                onClick = { this._onToolbarToggleChat }
                                toggled = { _chatOpen }
                                tooltip = { t('toolbar.chat') } />
                            <ChatCounter />
                        </div> }
                    {
                        buttonsLeft.indexOf('closedcaptions') !== -1
                            && <ClosedCaptionButton />
                    }
                </div>
                <div className = 'button-group-center'>
                    { this._renderAudioButton() }
                    <HangupButton
                        visible = { this._shouldShowButton('hangup') } />
                    { this._renderVideoButton() }
                </div>
                <div className = 'button-group-right'>
                    { buttonsRight.indexOf('localrecording') !== -1
                        && <LocalRecordingButton
                            onClick = {
                                this._onToolbarOpenLocalRecordingInfoDialog
                            } />
                    }
                    { buttonsRight.indexOf('tileview') !== -1
                        && <TileViewButton /> }
                    { buttonsRight.indexOf('invite') !== -1
                        && <ToolbarButton
                            accessibilityLabel =
                                { t('toolbar.accessibilityLabel.invite') }
                            icon = { IconInviteMore }
                            onClick = { this._onToolbarOpenInvite }
                            tooltip = { t('toolbar.invite') } /> }
                    { buttonsRight.indexOf('security') !== -1
                        && <SecurityDialogButton customClass = 'security-toolbar-button' /> }
                    { buttonsRight.indexOf('overflowmenu') !== -1
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
            </div>);
    }

    _shouldShowButton: (string) => boolean;

    /**
     * Returns if a button name has been explicitly configured to be displayed.
     *
     * @param {string} buttonName - The name of the button, as expected in
     * {@link interfaceConfig}.
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
    const { conference, locked } = state['features/base/conference'];
    let { desktopSharingEnabled } = state['features/base/conference'];
    const {
        callStatsID,
        enableFeaturesBasedOnToken
    } = state['features/base/config'];
    const sharedVideoStatus = state['features/shared-video'].status;
    const {
        fullScreen,
        overflowMenuVisible
    } = state['features/toolbox'];
    const localParticipant = getLocalParticipant(state);
    const localRecordingStates = state['features/local-recording'];
    const localVideo = getLocalVideoTrack(state['features/base/tracks']);

    let desktopSharingDisabledTooltipKey;

    if (enableFeaturesBasedOnToken) {
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
    }

    // NB: We compute the buttons again here because if URL parameters were used to
    // override them we'd miss it.
    const buttons = new Set(interfaceConfig.TOOLBAR_BUTTONS);

    return {
        _chatOpen: state['features/chat'].isOpen,
        _conference: conference,
        _desktopSharingEnabled: desktopSharingEnabled,
        _desktopSharingDisabledTooltipKey: desktopSharingDisabledTooltipKey,
        _dialog: Boolean(state['features/base/dialog'].component),
        _feedbackConfigured: Boolean(callStatsID),
        _isGuest: state['features/base/jwt'].isGuest,
        _fullScreen: fullScreen,
        _tileViewEnabled: state['features/video-layout'].tileViewEnabled,
        _localParticipantID: localParticipant.id,
        _localRecState: localRecordingStates,
        _locked: locked,
        _overflowMenuVisible: overflowMenuVisible,
        _raisedHand: localParticipant.raisedHand,
        _screensharing: localVideo && localVideo.videoType === 'desktop',
        _sharingVideo: sharedVideoStatus === 'playing'
            || sharedVideoStatus === 'start'
            || sharedVideoStatus === 'pause',
        _visible: isToolboxVisible(state),
        _visibleButtons: equals(visibleButtons, buttons) ? visibleButtons : buttons
    };
}

export default translate(connect(_mapStateToProps)(Toolbox));
