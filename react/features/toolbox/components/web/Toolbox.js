// @flow

import React, { Component } from 'react';

import {
    ACTION_SHORTCUT_TRIGGERED,
    createShortcutEvent,
    createToolbarEvent,
    sendAnalytics
} from '../../../analytics';
import { getToolbarButtons } from '../../../base/config';
import { isToolbarButtonEnabled } from '../../../base/config/functions.web';
import { openDialog, toggleDialog } from '../../../base/dialog';
import { isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n';
import {
    IconChat,
    IconCodeBlock,
    IconDeviceDocument,
    IconExitFullScreen,
    IconFeedback,
    IconFullScreen,
    IconParticipants,
    IconPresentation,
    IconRaisedHand,
    IconRec,
    IconShareAudio,
    IconShareDesktop
} from '../../../base/icons';
import JitsiMeetJS from '../../../base/lib-jitsi-meet';
import {
    getLocalParticipant,
    getParticipants,
    participantUpdated
} from '../../../base/participants';
import { connect } from '../../../base/redux';
import { OverflowMenuItem } from '../../../base/toolbox/components';
import { getLocalVideoTrack, toggleScreensharing } from '../../../base/tracks';
import { isVpaasMeeting } from '../../../billing-counter/functions';
import { ChatCounter, toggleChat } from '../../../chat';
import { EmbedMeetingDialog } from '../../../embed-meeting';
import { SharedDocumentButton } from '../../../etherpad';
import { openFeedbackDialog } from '../../../feedback';
import { openKeyboardShortcutsDialog } from '../../../keyboard-shortcuts';
import { LocalRecordingInfoDialog } from '../../../local-recording';
import {
    close as closeParticipantsPane,
    open as openParticipantsPane
} from '../../../participants-pane/actions';
import { getParticipantsPaneOpen } from '../../../participants-pane/functions';
import {
    LiveStreamButton,
    RecordButton
} from '../../../recording';
import { isScreenAudioShared, isScreenAudioSupported } from '../../../screen-share/';
import SecurityDialogButton from '../../../security/components/security-dialog/SecurityDialogButton';
import {
    SETTINGS_TABS,
    SettingsButton,
    openSettingsDialog
} from '../../../settings';
import { SharedVideoButton } from '../../../shared-video/components';
import { SpeakerStats } from '../../../speaker-stats';
import {
    ClosedCaptionButton
} from '../../../subtitles';
import {
    TileViewButton,
    shouldDisplayTileView,
    toggleTileView
} from '../../../video-layout';
import {
    OverflowMenuVideoQualityItem,
    VideoQualityDialog
} from '../../../video-quality';
import { VideoBackgroundButton } from '../../../virtual-background';
import { toggleBackgroundEffect } from '../../../virtual-background/actions';
import { VIRTUAL_BACKGROUND_TYPE } from '../../../virtual-background/constants';
import { checkBlurSupport } from '../../../virtual-background/functions';
import {
    setFullScreen,
    setOverflowMenuVisible,
    setToolbarHovered,
    showToolbox
} from '../../actions';
import { getToolbarAdditionalButtons, isToolboxVisible } from '../../functions';
import DownloadButton from '../DownloadButton';
import HangupButton from '../HangupButton';
import HelpButton from '../HelpButton';
import MuteEveryoneButton from '../MuteEveryoneButton';
import MuteEveryonesVideoButton from '../MuteEveryonesVideoButton';

import AudioSettingsButton from './AudioSettingsButton';
import OverflowMenuButton from './OverflowMenuButton';
import OverflowMenuProfileItem from './OverflowMenuProfileItem';
import ToggleCameraButton from './ToggleCameraButton';
import ToolbarButton from './ToolbarButton';
import VideoSettingsButton from './VideoSettingsButton';


/**
 * The type of the React {@code Component} props of {@link Toolbox}.
 */
type Props = {

    /**
     * String showing if the virtual background type is desktop-share.
     */
    _backgroundType: String,

    /**
     * Whether or not the chat feature is currently displayed.
     */
    _chatOpen: boolean,

    /**
     * The width of the client.
     */
    _clientWidth: number,

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
     * Whether or not the app is running in mobile browser.
     */
    _isMobile: boolean,

    /**
     * Whether or not the profile is disabled.
     */
    _isProfileDisabled: boolean,

    /**
     * Whether or not the tile view is enabled.
     */
    _tileViewEnabled: boolean,

    /**
     * Whether or not the current meeting belongs to a JaaS user.
     */
    _isVpaasMeeting: boolean,

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
     * The JitsiLocalTrack to display.
     */
    _localVideo: Object,

    /**
     * Whether or not the overflow menu is visible.
     */
    _overflowMenuVisible: boolean,

    /**
     * Whether or not the participants pane is open.
     */
    _participantsPaneOpen: boolean,

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
     * Array with the buttons which this Toolbox should display.
     */
    _visibleButtons: Array<string>,

    /**
     * Handler to check if a button is enabled.
     */
     _shouldShowButton: Function,

    /**
     * Returns the selected virtual source object.
     */
     _virtualSource: Object,

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
        this._onTabIn = this._onTabIn.bind(this);

        this._onShortcutToggleChat = this._onShortcutToggleChat.bind(this);
        this._onShortcutToggleFullScreen = this._onShortcutToggleFullScreen.bind(this);
        this._onShortcutToggleParticipantsPane = this._onShortcutToggleParticipantsPane.bind(this);
        this._onShortcutToggleRaiseHand = this._onShortcutToggleRaiseHand.bind(this);
        this._onShortcutToggleScreenshare = this._onShortcutToggleScreenshare.bind(this);
        this._onShortcutToggleVideoQuality = this._onShortcutToggleVideoQuality.bind(this);
        this._onToolbarOpenFeedback = this._onToolbarOpenFeedback.bind(this);
        this._onToolbarToggleParticipantsPane = this._onToolbarToggleParticipantsPane.bind(this);
        this._onToolbarOpenKeyboardShortcuts = this._onToolbarOpenKeyboardShortcuts.bind(this);
        this._onToolbarOpenSpeakerStats = this._onToolbarOpenSpeakerStats.bind(this);
        this._onToolbarOpenEmbedMeeting = this._onToolbarOpenEmbedMeeting.bind(this);
        this._onToolbarOpenVideoQuality = this._onToolbarOpenVideoQuality.bind(this);
        this._onToolbarToggleChat = this._onToolbarToggleChat.bind(this);
        this._onToolbarToggleFullScreen = this._onToolbarToggleFullScreen.bind(this);
        this._onToolbarToggleProfile = this._onToolbarToggleProfile.bind(this);
        this._onToolbarToggleRaiseHand = this._onToolbarToggleRaiseHand.bind(this);
        this._onToolbarToggleScreenshare = this._onToolbarToggleScreenshare.bind(this);
        this._onToolbarToggleShareAudio = this._onToolbarToggleShareAudio.bind(this);
        this._onToolbarOpenLocalRecordingInfoDialog = this._onToolbarOpenLocalRecordingInfoDialog.bind(this);
        this._onShortcutToggleTileView = this._onShortcutToggleTileView.bind(this);
    }

    /**
     * Sets keyboard shortcuts for to trigger ToolbarButtons actions.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        const KEYBOARD_SHORTCUTS = [
            this.props._shouldShowButton('videoquality') && {
                character: 'A',
                exec: this._onShortcutToggleVideoQuality,
                helpDescription: 'toolbar.callQuality'
            },
            this.props._shouldShowButton('chat') && {
                character: 'C',
                exec: this._onShortcutToggleChat,
                helpDescription: 'keyboardShortcuts.toggleChat'
            },
            this.props._shouldShowButton('desktop') && {
                character: 'D',
                exec: this._onShortcutToggleScreenshare,
                helpDescription: 'keyboardShortcuts.toggleScreensharing'
            },
            this.props._shouldShowButton('participants-pane') && {
                character: 'P',
                exec: this._onShortcutToggleParticipantsPane,
                helpDescription: 'keyboardShortcuts.toggleParticipantsPane'
            },
            this.props._shouldShowButton('raisehand') && {
                character: 'R',
                exec: this._onShortcutToggleRaiseHand,
                helpDescription: 'keyboardShortcuts.raiseHand'
            },
            this.props._shouldShowButton('fullscreen') && {
                character: 'S',
                exec: this._onShortcutToggleFullScreen,
                helpDescription: 'keyboardShortcuts.fullScreen'
            },
            this.props._shouldShowButton('tileview') && {
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
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _chatOpen, _visible, _visibleButtons } = this.props;
        const rootClassNames = `new-toolbox ${_visible ? 'visible' : ''} ${
            _visibleButtons.length ? '' : 'no-buttons'} ${_chatOpen ? 'shift-right' : ''}`;

        return (
            <div
                className = { rootClassNames }
                id = 'new-toolbox'>
                { this._renderToolboxContent() }
            </div>
        );
    }

    /**
     * Closes the overflow menu if opened.
     *
     * @private
     * @returns {void}
     */
    _closeOverflowMenuIfOpen() {
        const { dispatch, _overflowMenuVisible } = this.props;

        _overflowMenuVisible && dispatch(setOverflowMenuVisible(false));
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
     * Callback invoked to display {@code FeedbackDialog}.
     *
     * @private
     * @returns {void}
     */
    _doOpenEmbedMeeting() {
        this.props.dispatch(openDialog(EmbedMeetingDialog));
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
        const newRaisedStatus = !_raisedHand;

        this.props.dispatch(participantUpdated({
            // XXX Only the local participant is allowed to update without
            // stating the JitsiConference instance (i.e. participant property
            // `conference` for a remote participant) because the local
            // participant is uniquely identified by the very fact that there is
            // only one local participant.

            id: _localParticipantID,
            local: true,
            raisedHand: newRaisedStatus
        }));

        APP.API.notifyRaiseHandUpdated(_localParticipantID, newRaisedStatus);
    }

    /**
     * Dispatches an action to toggle screensharing.
     *
     * @private
     * @param {boolean} enabled - The state to toggle screen sharing to.
     * @param {boolean} audioOnly - Only share system audio.
     * @returns {void}
     */
    _doToggleScreenshare(enabled, audioOnly = false) {
        if (this.props._desktopSharingEnabled) {
            this.props.dispatch(toggleScreensharing(enabled, audioOnly));
        }
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

    _onShortcutToggleParticipantsPane: () => void;

    /**
     * Creates an analytics keyboard shortcut event and dispatches an action for
     * toggling the display of the participants pane.
     *
     * @private
     * @returns {void}
     */
    _onShortcutToggleParticipantsPane() {
        sendAnalytics(createShortcutEvent(
            'toggle.participants-pane',
            {
                enable: !this.props._participantsPaneOpen
            }));

        this._onToolbarToggleParticipantsPane();
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
        const enable = !this.props._screensharing;

        sendAnalytics(createToolbarEvent(
            'screen.sharing',
            {
                enable
            }));

        this._doToggleScreenshare(enable);
    }

    _onTabIn: () => void;

    /**
     * Toggle the toolbar visibility when tabbing into it.
     *
     * @returns {void}
     */
    _onTabIn() {
        if (!this.props._visible) {
            this.props.dispatch(showToolbox());
        }
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

    _onToolbarToggleParticipantsPane: () => void;

    /**
     * Dispatches an action for toggling the participants pane.
     *
     * @private
     * @returns {void}
     */
    _onToolbarToggleParticipantsPane() {
        const { dispatch, _participantsPaneOpen } = this.props;

        if (_participantsPaneOpen) {
            dispatch(closeParticipantsPane());
        } else {
            dispatch(openParticipantsPane());
        }
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

    _onToolbarOpenEmbedMeeting: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for opening
     * the embed meeting modal.
     *
     * @private
     * @returns {void}
     */
    _onToolbarOpenEmbedMeeting() {
        sendAnalytics(createToolbarEvent('embed.meeting'));

        this._doOpenEmbedMeeting();
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
        this._closeOverflowMenuIfOpen();
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
        this._closeOverflowMenuIfOpen();
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
        if (this.props._backgroundType === VIRTUAL_BACKGROUND_TYPE.DESKTOP_SHARE) {
            const noneOptions = {
                enabled: false,
                backgroundType: VIRTUAL_BACKGROUND_TYPE.NONE,
                selectedThumbnail: VIRTUAL_BACKGROUND_TYPE.NONE,
                backgroundEffectEnabled: false
            };

            this.props._virtualSource.dispose();

            this.props.dispatch(toggleBackgroundEffect(noneOptions, this.props._localVideo));

            return;
        }
        if (!this.props._desktopSharingEnabled) {
            return;
        }

        const enable = !this.props._screensharing;

        sendAnalytics(createShortcutEvent(
            'toggle.screen.sharing',
            ACTION_SHORTCUT_TRIGGERED,
            { enable }));

        this._closeOverflowMenuIfOpen();
        this._doToggleScreenshare(enable);
    }

    _onToolbarToggleShareAudio: () => void;

    /**
     * Handles toggle share audio action.
     *
     * @returns {void}
     */
    _onToolbarToggleShareAudio() {
        const enable = !this.props._screensharing;

        this._closeOverflowMenuIfOpen();
        this._doToggleScreenshare(enable, true);
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
     * Returns true if the desktop sharing button should be visible and
     * false otherwise.
     *
     * @returns {boolean}
     */
    _showDesktopSharingButton() {
        const {
            _desktopSharingEnabled,
            _desktopSharingDisabledTooltipKey
        } = this.props;

        return (
            (_desktopSharingEnabled
            || _desktopSharingDisabledTooltipKey)
            && this.props._shouldShowButton('desktop')
        );
    }

    /**
     * Returns true if the embed meeting button is visible and false otherwise.
     *
     * @returns {boolean}
     */
    _isEmbedMeetingVisible() {
        return !this.props._isVpaasMeeting
            && !this.props._isMobile
            && this.props._shouldShowButton('embedmeeting');
    }

    /**
     * Returns true if the profile button is visible and false otherwise.
     *
     * @returns {boolean}
     */
    _isProfileVisible() {
        return !this.props._isProfileDisabled && this.props._shouldShowButton('profile');
    }

    /**
     * Renders the list elements of the overflow menu.
     *
     * @private
     * @param {Array<React$Element>} additionalButtons - Additional buttons to be displayed.
     * @returns {Array<React$Element>}
     */
    _renderOverflowMenuContent(additionalButtons: Array<React$Element<any>>) {
        const {
            _desktopSharingEnabled,
            _feedbackConfigured,
            _fullScreen,
            _isMobile,
            _screensharing,
            t
        } = this.props;

        const group1 = [
            ...additionalButtons,

            this.props._shouldShowButton('toggle-camera')
                && <ToggleCameraButton
                    key = 'toggle-camera'
                    showLabel = { true } />,
            this.props._shouldShowButton('videoquality')
                && <OverflowMenuVideoQualityItem
                    key = 'videoquality'
                    onClick = { this._onToolbarOpenVideoQuality } />,
            this.props._shouldShowButton('fullscreen')
                && !_isMobile
                && <OverflowMenuItem
                    accessibilityLabel = { t('toolbar.accessibilityLabel.fullScreen') }
                    icon = { _fullScreen ? IconExitFullScreen : IconFullScreen }
                    key = 'fullscreen'
                    onClick = { this._onToolbarToggleFullScreen }
                    text = { _fullScreen ? t('toolbar.exitFullScreen') : t('toolbar.enterFullScreen') } />,
            (this.props._shouldShowButton('security') || this.props._shouldShowButton('info'))
            && <SecurityDialogButton
                key = 'security'
                showLabel = { true } />,
            this.props._shouldShowButton('closedcaptions')
            && <ClosedCaptionButton
                key = 'closed-captions'
                showLabel = { true } />,
            this.props._shouldShowButton('recording')
                && <RecordButton
                    key = 'record'
                    showLabel = { true } />,
            this.props._shouldShowButton('localrecording')
                && <OverflowMenuItem
                    accessibilityLabel = { t('toolbar.accessibilityLabel.localRecording') }
                    icon = { IconRec }
                    key = 'localrecording'
                    onClick = { this._onToolbarOpenLocalRecordingInfoDialog }
                    text = { t('localRecording.dialogTitle') } />,
            this.props._shouldShowButton('mute-everyone')
                && <MuteEveryoneButton
                    key = 'mute-everyone'
                    showLabel = { true } />,
            this.props._shouldShowButton('mute-video-everyone')
                && <MuteEveryonesVideoButton
                    key = 'mute-everyones-video'
                    showLabel = { true } />,
            this.props._shouldShowButton('livestreaming')
                && <LiveStreamButton
                    key = 'livestreaming'
                    showLabel = { true } />
        ];

        const group2 = [
            this.props._shouldShowButton('sharedvideo')
                && <SharedVideoButton
                    key = 'sharedvideo'
                    showLabel = { true } />,
            this.props._shouldShowButton('shareaudio')
                && _desktopSharingEnabled
                && isScreenAudioSupported()
                && <OverflowMenuItem
                    accessibilityLabel = { t('toolbar.accessibilityLabel.shareaudio') }
                    icon = { IconShareAudio }
                    key = 'shareaudio'
                    onClick = { this._onToolbarToggleShareAudio }
                    text = { t('toolbar.shareaudio') } />,
            this.props._shouldShowButton('etherpad')
                && <SharedDocumentButton
                    key = 'etherpad'
                    showLabel = { true } />,
            (this.props._shouldShowButton('select-background') || this.props._shouldShowButton('videobackgroundblur'))
                && <VideoBackgroundButton
                    key = { 'select-background' }
                    showLabel = { true }
                    visible = { !_screensharing && checkBlurSupport() } />,
            this.props._shouldShowButton('stats')
                && <OverflowMenuItem
                    accessibilityLabel = { t('toolbar.accessibilityLabel.speakerStats') }
                    icon = { IconPresentation }
                    key = 'stats'
                    onClick = { this._onToolbarOpenSpeakerStats }
                    text = { t('toolbar.speakerStats') } />
        ];


        return [
            this._isProfileVisible()
                && <OverflowMenuProfileItem
                    key = 'profile'
                    onClick = { this._onToolbarToggleProfile } />,
            this._isProfileVisible()
                && <hr
                    className = 'overflow-menu-hr'
                    key = 'hr1' />,

            ...group1,
            group1.some(Boolean)
            && <hr
                className = 'overflow-menu-hr'
                key = 'hr2' />,

            ...group2,
            group2.some(Boolean)
            && <hr
                className = 'overflow-menu-hr'
                key = 'hr3' />,

            this.props._shouldShowButton('settings')
                && <SettingsButton
                    key = 'settings'
                    showLabel = { true } />,
            this.props._shouldShowButton('shortcuts')
                && !_isMobile
                && <OverflowMenuItem
                    accessibilityLabel = { t('toolbar.accessibilityLabel.shortcuts') }
                    icon = { IconDeviceDocument }
                    key = 'shortcuts'
                    onClick = { this._onToolbarOpenKeyboardShortcuts }
                    text = { t('toolbar.shortcuts') } />,
            this._isEmbedMeetingVisible()
                && <OverflowMenuItem
                    accessibilityLabel = { t('toolbar.accessibilityLabel.embedMeeting') }
                    icon = { IconCodeBlock }
                    key = 'embed'
                    onClick = { this._onToolbarOpenEmbedMeeting }
                    text = { t('toolbar.embedMeeting') } />,
            this.props._shouldShowButton('feedback')
                && _feedbackConfigured
                && <OverflowMenuItem
                    accessibilityLabel = { t('toolbar.accessibilityLabel.feedback') }
                    icon = { IconFeedback }
                    key = 'feedback'
                    onClick = { this._onToolbarOpenFeedback }
                    text = { t('toolbar.feedback') } />,
            this.props._shouldShowButton('download')
                && <DownloadButton
                    key = 'download'
                    showLabel = { true } />,
            this.props._shouldShowButton('help')
                && <HelpButton
                    key = 'help'
                    showLabel = { true } />
        ];
    }

    /**
     * Returns the buttons to be displayed in main or the overflow menu.
     *
     * @param {Set} buttons - A set containing the buttons to be displayed
     * in the toolbar beside the main audio/video & hanugup.
     * @returns {Object}
     */
    _getAdditionalButtons(buttons) {
        const {
            _chatOpen,
            _desktopSharingEnabled,
            _desktopSharingDisabledTooltipKey,
            _raisedHand,
            _screensharing,
            t
        } = this.props;

        const overflowMenuAdditionalButtons = [];
        const mainMenuAdditionalButtons = [];

        if (this._showDesktopSharingButton()) {
            buttons.has('desktop')
                ? mainMenuAdditionalButtons.push(<ToolbarButton
                    accessibilityLabel = { t('toolbar.accessibilityLabel.shareYourScreen') }
                    disabled = { !_desktopSharingEnabled }
                    icon = { IconShareDesktop }
                    key = 'desktop'
                    onClick = { this._onToolbarToggleScreenshare }
                    toggled = { _screensharing }
                    tooltip = { t(_desktopSharingEnabled
                        ? 'dialog.shareYourScreen' : _desktopSharingDisabledTooltipKey) } />)
                : overflowMenuAdditionalButtons.push(<OverflowMenuItem
                    accessibilityLabel = { t('toolbar.accessibilityLabel.shareYourScreen') }
                    icon = { IconShareDesktop }
                    iconId = 'share-desktop'
                    key = 'desktop'
                    onClick = { this._onToolbarToggleScreenshare }
                    text = { t(`toolbar.${_screensharing ? 'stopScreenSharing' : 'startScreenSharing'}`) } />);
        }

        if (this.props._shouldShowButton('chat')) {
            buttons.has('chat')
                ? mainMenuAdditionalButtons.push(<div
                    className = 'toolbar-button-with-badge'
                    key = 'chatcontainer'>
                    <ToolbarButton
                        accessibilityLabel = { t('toolbar.accessibilityLabel.chat') }
                        icon = { IconChat }
                        key = 'chat'
                        onClick = { this._onToolbarToggleChat }
                        toggled = { _chatOpen }
                        tooltip = { t('toolbar.chat') } />
                    <ChatCounter />
                </div>) : overflowMenuAdditionalButtons.push(<OverflowMenuItem
                    accessibilityLabel = { t('toolbar.accessibilityLabel.chat') }
                    icon = { IconChat }
                    key = 'chat'
                    onClick = { this._onToolbarToggleChat }
                    text = { t(`toolbar.${_chatOpen ? 'closeChat' : 'openChat'}`) } />);
        }

        if (this.props._shouldShowButton('raisehand')) {
            buttons.has('raisehand')
                ? mainMenuAdditionalButtons.push(<ToolbarButton
                    accessibilityLabel = { t('toolbar.accessibilityLabel.raiseHand') }
                    icon = { IconRaisedHand }
                    key = 'raisehand'
                    onClick = { this._onToolbarToggleRaiseHand }
                    toggled = { _raisedHand }
                    tooltip = { t(`toolbar.${_raisedHand ? 'lowerYourHand' : 'raiseYourHand'}`) } />)
                : overflowMenuAdditionalButtons.push(<OverflowMenuItem
                    accessibilityLabel = { t('toolbar.accessibilityLabel.raiseHand') }
                    icon = { IconRaisedHand }
                    key = 'raisehand'
                    onClick = { this._onToolbarToggleRaiseHand }
                    text = { t(`toolbar.${_raisedHand ? 'lowerYourHand' : 'raiseYourHand'}`) } />);
        }

        if (this.props._shouldShowButton('participants-pane') || this.props._shouldShowButton('invite')) {
            buttons.has('participants-pane')
                ? mainMenuAdditionalButtons.push(
                    <ToolbarButton
                        accessibilityLabel = { t('toolbar.accessibilityLabel.participants') }
                        icon = { IconParticipants }
                        onClick = { this._onToolbarToggleParticipantsPane }
                        toggled = { this.props._participantsPaneOpen }
                        tooltip = { t('toolbar.participants') } />)
                : overflowMenuAdditionalButtons.push(
                    <OverflowMenuItem
                        accessibilityLabel = { t('toolbar.accessibilityLabel.participants') }
                        icon = { IconParticipants }
                        key = 'participants-pane'
                        onClick = { this._onToolbarToggleParticipantsPane }
                        text = { t('toolbar.participants') } />
                );
        }

        if (this.props._shouldShowButton('tileview')) {
            buttons.has('tileview')
                ? mainMenuAdditionalButtons.push(
                    <TileViewButton
                        key = 'tileview'
                        showLabel = { false } />)
                : overflowMenuAdditionalButtons.push(
                    <TileViewButton
                        key = 'tileview'
                        showLabel = { true } />);
        }

        return {
            mainMenuAdditionalButtons,
            overflowMenuAdditionalButtons
        };
    }

    /**
     * Renders the Audio controlling button.
     *
     * @returns {ReactElement}
     */
    _renderAudioButton() {
        return this.props._shouldShowButton('microphone')
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
        return this.props._shouldShowButton('camera')
            ? <VideoSettingsButton
                key = 'vsb'
                visible = { true } />
            : null;
    }

    /**
     * Renders the toolbox content.
     *
     * @returns {ReactElement}
     */
    _renderToolboxContent() {
        const {
            _clientWidth,
            _isMobile,
            _overflowMenuVisible,
            t
        } = this.props;

        const buttonSet = getToolbarAdditionalButtons(_clientWidth, _isMobile);
        const toolbarAccLabel = 'toolbar.accessibilityLabel.moreActionsMenu';
        const showOverflowMenuButton = buttonSet.has('overflow');
        const containerClassName = `toolbox-content${_isMobile ? ' toolbox-content-mobile' : ''}`;
        let overflowMenuAdditionalButtons = [];
        let mainMenuAdditionalButtons = [];


        if (showOverflowMenuButton) {
            ({ overflowMenuAdditionalButtons, mainMenuAdditionalButtons } = this._getAdditionalButtons(buttonSet));
        }

        return (
            <div className = { containerClassName }>
                <div
                    className = 'toolbox-content-wrapper'
                    onFocus = { this._onTabIn }
                    onMouseOut = { this._onMouseOut }
                    onMouseOver = { this._onMouseOver }>
                    <div className = 'toolbox-content-items'>
                        { this._renderAudioButton() }
                        { this._renderVideoButton() }
                        { mainMenuAdditionalButtons }
                        { showOverflowMenuButton && <OverflowMenuButton
                            isOpen = { _overflowMenuVisible }
                            onVisibilityChange = { this._onSetOverflowVisible }>
                            <ul
                                aria-label = { t(toolbarAccLabel) }
                                className = 'overflow-menu'>
                                { this._renderOverflowMenuContent(overflowMenuAdditionalButtons) }
                            </ul>
                        </OverflowMenuButton>}
                        <HangupButton
                            customClass = 'hangup-button'
                            visible = { this.props._shouldShowButton('hangup') } />
                    </div>
                </div>
            </div>
        );
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
    let desktopSharingEnabled = JitsiMeetJS.isDesktopSharingEnabled();
    const {
        callStatsID,
        enableFeaturesBasedOnToken
    } = state['features/base/config'];
    const {
        fullScreen,
        overflowMenuVisible
    } = state['features/toolbox'];
    const localParticipant = getLocalParticipant(state);
    const localRecordingStates = state['features/local-recording'];
    const localVideo = getLocalVideoTrack(state['features/base/tracks']);
    const { clientWidth } = state['features/base/responsive-ui'];

    let desktopSharingDisabledTooltipKey;

    if (enableFeaturesBasedOnToken) {
        // we enable desktop sharing if any participant already have this
        // feature enabled
        desktopSharingEnabled = getParticipants(state)
            .find(({ features = {} }) =>
                String(features['screen-sharing']) === 'true') !== undefined;
        desktopSharingDisabledTooltipKey = 'dialog.shareYourScreenDisabled';
    }

    return {
        _chatOpen: state['features/chat'].isOpen,
        _clientWidth: clientWidth,
        _conference: conference,
        _desktopSharingEnabled: desktopSharingEnabled,
        _backgroundType: state['features/virtual-background'].backgroundType,
        _virtualSource: state['features/virtual-background'].virtualSource,
        _desktopSharingDisabledTooltipKey: desktopSharingDisabledTooltipKey,
        _dialog: Boolean(state['features/base/dialog'].component),
        _feedbackConfigured: Boolean(callStatsID),
        _isProfileDisabled: Boolean(state['features/base/config'].disableProfile),
        _isMobile: isMobileBrowser(),
        _isVpaasMeeting: isVpaasMeeting(state),
        _fullScreen: fullScreen,
        _tileViewEnabled: shouldDisplayTileView(state),
        _localParticipantID: localParticipant.id,
        _localVideo: localVideo,
        _localRecState: localRecordingStates,
        _locked: locked,
        _overflowMenuVisible: overflowMenuVisible,
        _participantsPaneOpen: getParticipantsPaneOpen(state),
        _raisedHand: localParticipant.raisedHand,
        _screensharing: (localVideo && localVideo.videoType === 'desktop') || isScreenAudioShared(state),
        _shouldShowButton: buttonName => isToolbarButtonEnabled(buttonName)(state),
        _visible: isToolboxVisible(state),
        _visibleButtons: getToolbarButtons(state)
    };
}

export default translate(connect(_mapStateToProps)(Toolbox));
