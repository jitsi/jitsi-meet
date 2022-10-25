/* eslint-disable lines-around-comment */
import { withStyles } from '@mui/styles';
import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { batch } from 'react-redux';

// @ts-expect-error
import keyboardShortcut from '../../../../../modules/keyboardshortcut/keyboardshortcut';
// @ts-ignore
import { isSpeakerStatsDisabled } from '../../../../features/speaker-stats/functions';
import { ACTION_SHORTCUT_TRIGGERED, createShortcutEvent, createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState } from '../../../app/types';
import {
    getMultipleVideoSendingSupportFeatureFlag,
    getToolbarButtons,
    isToolbarButtonEnabled
} from '../../../base/config/functions.web';
import { openDialog, toggleDialog } from '../../../base/dialog/actions';
import { isIosMobileBrowser, isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n/functions';
import JitsiMeetJS from '../../../base/lib-jitsi-meet';
import {
    raiseHand
} from '../../../base/participants/actions';
import {
    getLocalParticipant,
    hasRaisedHand
} from '../../../base/participants/functions';
import { connect } from '../../../base/redux/functions';
import { getLocalVideoTrack } from '../../../base/tracks/functions';
import ContextMenu from '../../../base/ui/components/web/ContextMenu';
import ContextMenuItemGroup from '../../../base/ui/components/web/ContextMenuItemGroup';
import { toggleChat } from '../../../chat/actions.web';
// @ts-ignore
import { ChatButton } from '../../../chat/components';
// @ts-ignore
import { EmbedMeetingButton } from '../../../embed-meeting';
// @ts-ignore
import { SharedDocumentButton } from '../../../etherpad';
// @ts-ignore
import { FeedbackButton } from '../../../feedback';
import { setGifMenuVisibility } from '../../../gifs/actions';
import { isGifEnabled } from '../../../gifs/functions';
// @ts-ignore
import { InviteButton } from '../../../invite/components/add-people-dialog';
import { isVpaasMeeting } from '../../../jaas/functions';
// @ts-ignore
import { KeyboardShortcutsButton } from '../../../keyboard-shortcuts';
import { NoiseSuppressionButton } from '../../../noise-suppression/components';
import {
    close as closeParticipantsPane,
    open as openParticipantsPane
} from '../../../participants-pane/actions';
// @ts-ignore
import { ParticipantsPaneButton } from '../../../participants-pane/components/web';
import { getParticipantsPaneOpen } from '../../../participants-pane/functions';
import { addReactionToBuffer } from '../../../reactions/actions.any';
import { toggleReactionsMenuVisibility } from '../../../reactions/actions.web';
import ReactionsMenuButton from '../../../reactions/components/web/ReactionsMenuButton';
import { REACTIONS } from '../../../reactions/constants';
import { isReactionsEnabled } from '../../../reactions/functions.any';
import {
    LiveStreamButton,
    RecordButton
    // @ts-ignore
} from '../../../recording';
// @ts-ignore
import { isSalesforceEnabled } from '../../../salesforce/functions';
import {
    ShareAudioButton,
    isScreenAudioSupported,
    isScreenVideoShared,
    startScreenShareFlow
    // @ts-ignore
} from '../../../screen-share';
// @ts-ignore
import SecurityDialogButton from '../../../security/components/security-dialog/web/SecurityDialogButton';
// @ts-ignore
import { SettingsButton } from '../../../settings';
// @ts-ignore
import { SharedVideoButton } from '../../../shared-video/components';
// @ts-ignore
import { SpeakerStatsButton } from '../../../speaker-stats/components/web';
import SpeakerStats from '../../../speaker-stats/components/web/SpeakerStats';
import {
    ClosedCaptionButton
    // @ts-ignore
} from '../../../subtitles';
import {
    TileViewButton,
    shouldDisplayTileView,
    toggleTileView
    // @ts-ignore
} from '../../../video-layout';
// @ts-ignore
import { VideoQualityButton, VideoQualityDialog } from '../../../video-quality/components';
// @ts-ignore
import { VideoBackgroundButton } from '../../../virtual-background';
import WhiteboardButton from '../../../whiteboard/components/web/WhiteboardButton';
import { isWhiteboardButtonVisible } from '../../../whiteboard/functions';
import {
    setFullScreen,
    setHangupMenuVisible,
    setOverflowMenuVisible,
    setToolbarHovered,
    showToolbox
    // @ts-ignore
} from '../../actions';
import { NOTIFY_CLICK_MODE, NOT_APPLICABLE, THRESHOLDS } from '../../constants';
import { isDesktopShareButtonDisabled, isToolboxVisible } from '../../functions';
import { getJwtDisabledButtons } from '../../functions.any';
// @ts-ignore
import DownloadButton from '../DownloadButton';
// @ts-ignore
import HangupButton from '../HangupButton';
// @ts-ignore
import HelpButton from '../HelpButton';

// @ts-ignore
import AudioSettingsButton from './AudioSettingsButton';
// @ts-ignore
import DockIframeButton from './DockIframeButton';
import { EndConferenceButton } from './EndConferenceButton';
// @ts-ignore
import FullscreenButton from './FullscreenButton';
import HangupMenuButton from './HangupMenuButton';
import { LeaveConferenceButton } from './LeaveConferenceButton';
// @ts-ignore
import LinkToSalesforceButton from './LinkToSalesforceButton';
// @ts-ignore
import OverflowMenuButton from './OverflowMenuButton';
// @ts-ignore
import ProfileButton from './ProfileButton';
// @ts-ignore
import Separator from './Separator';
// @ts-ignore
import ShareDesktopButton from './ShareDesktopButton';
// @ts-ignore
import ToggleCameraButton from './ToggleCameraButton';
// @ts-ignore
import UndockIframeButton from './UndockIframeButton';
// @ts-ignore
import VideoSettingsButton from './VideoSettingsButton';

/**
 * The type of the React {@code Component} props of {@link Toolbox}.
 */
interface IProps extends WithTranslation {

    /**
     * String showing if the virtual background type is desktop-share.
     */
    _backgroundType: String;

    /**
     * Toolbar buttons which have their click exposed through the API.
     */
    _buttonsWithNotifyClick: Array<string | {
        key: string;
        preventExecution: boolean;
    }>;

    /**
     * Whether or not the chat feature is currently displayed.
     */
    _chatOpen: boolean;

    /**
     * The width of the client.
     */
    _clientWidth: number;

    /**
     * The {@code JitsiConference} for the current conference.
     */
    _conference: Object;

    /**
     * Whether or not screensharing button is disabled.
     */
    _desktopSharingButtonDisabled: boolean;

    /**
     * Whether or not screensharing is initialized.
     */
    _desktopSharingEnabled: boolean;

    /**
     * Whether or not a dialog is displayed.
     */
    _dialog: boolean;

    /**
     * Whether or not the toolbox is disabled. It is for recorders.
     */
    _disabled: boolean;

    /**
     * Whether the end conference feature is supported.
     */
    _endConferenceSupported: boolean;

    /**
     * Whether or not call feedback can be sent.
     */
    _feedbackConfigured: boolean;

    /**
     * Whether or not the app is currently in full screen.
     */
    _fullScreen: boolean;

    /**
     * Whether or not the GIFs feature is enabled.
     */
    _gifsEnabled: boolean;

    /**
     * Whether the hangup menu is visible.
     */
    _hangupMenuVisible: boolean;

    /**
     * Whether the app has Salesforce integration.
     */
    _hasSalesforce: boolean;

    /**
     * Whether or not the app is running in an ios mobile browser.
     */
    _isIosMobile: boolean;

    /**
     * Whether or not the app is running in mobile browser.
     */
    _isMobile: boolean;

    /**
     * Whether or not the profile is disabled.
     */
    _isProfileDisabled: boolean;

    /**
     * Whether or not speaker stats is disable.
     */
     _isSpeakerStatsDisabled: boolean;


     /**
     * Whether or not the current meeting belongs to a JaaS user.
     */
    _isVpaasMeeting: boolean;

    /**
     * The array of toolbar buttons disabled through jwt features.
     */
    _jwtDisabledButons: string[];

    /**
     * The ID of the local participant.
     */
    _localParticipantID: String;

    /**
     * The JitsiLocalTrack to display.
     */
    _localVideo: Object;

    /**
     * Whether or not multi-stream send support is enabled.
     */
    _multiStreamModeEnabled: boolean;

    /**
     * Whether or not the overflow menu is displayed in a drawer drawer.
     */
    _overflowDrawer: boolean;

    /**
     * Whether or not the overflow menu is visible.
     */
    _overflowMenuVisible: boolean;

    /**
     * Whether or not the participants pane is open.
     */
    _participantsPaneOpen: boolean;

    /**
     * Whether or not the local participant's hand is raised.
     */
    _raisedHand: boolean;

    /**
     * Whether or not reactions feature is enabled.
     */
    _reactionsEnabled: boolean;

    /**
     * Whether or not the local participant is screenSharing.
     */
    _screenSharing: boolean;

    /**
     * Whether or not the local participant is sharing a YouTube video.
     */
    _sharingVideo: boolean;

    /**
     * Whether or not the tile view is enabled.
     */
    _tileViewEnabled: boolean;

    /**
     * The enabled buttons.
     */
    _toolbarButtons: Array<string>;

    /**
     * Returns the selected virtual source object.
     */
    _virtualSource: any;

    /**
     * Flag showing whether toolbar is visible.
     */
    _visible: boolean;

    /**
     * Whether the whiteboard is visible.
     */
    _whiteboardEnabled: boolean;

    /**
     * An object containing the CSS classes.
     */
    classes: any;

    /**
     * Invoked to active other features of the app.
     */
    dispatch: Function;

    /**
     * Explicitly passed array with the buttons which this Toolbox should display.
     */
    toolbarButtons: Array<string>;
}

declare let APP: any;

const styles = () => {
    return {
        contextMenu: {
            position: 'relative' as const,
            right: 'auto',
            maxHeight: 'inherit',
            margin: 0,
            marginBottom: '8px'
        },

        hangupMenu: {
            position: 'relative' as const,
            right: 'auto',
            display: 'flex',
            flexDirection: 'column' as const,
            rowGap: '8px',
            margin: 0,
            padding: '16px',
            marginBottom: '8px'
        }
    };
};

/**
 * Implements the conference toolbox on React/Web.
 *
 * @augments Component
 */
class Toolbox extends Component<IProps> {
    /**
     * Initializes a new {@code Toolbox} instance.
     *
     * @param {IProps} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onMouseOut = this._onMouseOut.bind(this);
        this._onMouseOver = this._onMouseOver.bind(this);
        this._onSetHangupVisible = this._onSetHangupVisible.bind(this);
        this._onSetOverflowVisible = this._onSetOverflowVisible.bind(this);
        this._onTabIn = this._onTabIn.bind(this);

        this._onShortcutToggleChat = this._onShortcutToggleChat.bind(this);
        this._onShortcutToggleFullScreen = this._onShortcutToggleFullScreen.bind(this);
        this._onShortcutToggleParticipantsPane = this._onShortcutToggleParticipantsPane.bind(this);
        this._onShortcutToggleRaiseHand = this._onShortcutToggleRaiseHand.bind(this);
        this._onShortcutToggleScreenshare = this._onShortcutToggleScreenshare.bind(this);
        this._onShortcutToggleVideoQuality = this._onShortcutToggleVideoQuality.bind(this);
        this._onToolbarToggleParticipantsPane = this._onToolbarToggleParticipantsPane.bind(this);
        this._onToolbarOpenVideoQuality = this._onToolbarOpenVideoQuality.bind(this);
        this._onToolbarToggleChat = this._onToolbarToggleChat.bind(this);
        this._onToolbarToggleFullScreen = this._onToolbarToggleFullScreen.bind(this);
        this._onToolbarToggleRaiseHand = this._onToolbarToggleRaiseHand.bind(this);
        this._onToolbarToggleScreenshare = this._onToolbarToggleScreenshare.bind(this);
        this._onShortcutToggleTileView = this._onShortcutToggleTileView.bind(this);
        this._onShortcutSpeakerStats = this._onShortcutSpeakerStats.bind(this);
        this._onEscKey = this._onEscKey.bind(this);
    }

    /**
     * Sets keyboard shortcuts for to trigger ToolbarButtons actions.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        const { _toolbarButtons, t, dispatch, _reactionsEnabled, _gifsEnabled, _isSpeakerStatsDisabled } = this.props;

        const KEYBOARD_SHORTCUTS = [
            isToolbarButtonEnabled('videoquality', _toolbarButtons) && {
                character: 'A',
                exec: this._onShortcutToggleVideoQuality,
                helpDescription: 'toolbar.callQuality'
            },
            isToolbarButtonEnabled('chat', _toolbarButtons) && {
                character: 'C',
                exec: this._onShortcutToggleChat,
                helpDescription: 'keyboardShortcuts.toggleChat'
            },
            isToolbarButtonEnabled('desktop', _toolbarButtons) && {
                character: 'D',
                exec: this._onShortcutToggleScreenshare,
                helpDescription: 'keyboardShortcuts.toggleScreensharing'
            },
            isToolbarButtonEnabled('participants-pane', _toolbarButtons) && {
                character: 'P',
                exec: this._onShortcutToggleParticipantsPane,
                helpDescription: 'keyboardShortcuts.toggleParticipantsPane'
            },
            isToolbarButtonEnabled('raisehand', _toolbarButtons) && {
                character: 'R',
                exec: this._onShortcutToggleRaiseHand,
                helpDescription: 'keyboardShortcuts.raiseHand'
            },
            isToolbarButtonEnabled('fullscreen', _toolbarButtons) && {
                character: 'S',
                exec: this._onShortcutToggleFullScreen,
                helpDescription: 'keyboardShortcuts.fullScreen'
            },
            isToolbarButtonEnabled('tileview', _toolbarButtons) && {
                character: 'W',
                exec: this._onShortcutToggleTileView,
                helpDescription: 'toolbar.tileViewToggle'
            },
            !_isSpeakerStatsDisabled && isToolbarButtonEnabled('stats', _toolbarButtons) && {
                character: 'T',
                exec: this._onShortcutSpeakerStats,
                helpDescription: 'keyboardShortcuts.showSpeakerStats'
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

        if (_reactionsEnabled) {
            const REACTION_SHORTCUTS = Object.keys(REACTIONS).map(key => {
                const onShortcutSendReaction = () => {
                    dispatch(addReactionToBuffer(key));
                    sendAnalytics(createShortcutEvent(
                        `reaction.${key}`
                    ));
                };

                return {
                    character: REACTIONS[key].shortcutChar,
                    exec: onShortcutSendReaction,
                    helpDescription: t(`toolbar.reaction${key.charAt(0).toUpperCase()}${key.slice(1)}`),
                    altKey: true
                };
            });

            REACTION_SHORTCUTS.forEach(shortcut => {
                APP.keyboardshortcut.registerShortcut(
                    shortcut.character,
                    null,
                    shortcut.exec,
                    shortcut.helpDescription,
                    shortcut.altKey);
            });

            if (_gifsEnabled) {
                const onGifShortcut = () => {
                    batch(() => {
                        dispatch(toggleReactionsMenuVisibility());
                        dispatch(setGifMenuVisibility(true));
                    });
                };

                APP.keyboardshortcut.registerShortcut(
                    'G',
                    null,
                    onGifShortcut,
                    t('keyboardShortcuts.giphyMenu')
                );
            }
        }
    }

    /**
     * Update the visibility of the {@code OverflowMenuButton}.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps: IProps) {
        const { _dialog, _visible, dispatch } = this.props;


        if (prevProps._overflowMenuVisible
            && !prevProps._dialog
            && _dialog) {
            this._onSetOverflowVisible(false);
            dispatch(setToolbarHovered(false));
        }
        if (prevProps._hangupMenuVisible
            && prevProps._visible
            && !_visible) {
            this._onSetHangupVisible(false);
            dispatch(setToolbarHovered(false));
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

        if (this.props._reactionsEnabled) {
            Object.keys(REACTIONS).map(key => REACTIONS[key].shortcutChar)
                .forEach(letter =>
                    APP.keyboardshortcut.unregisterShortcut(letter, true));
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        if (this.props._disabled) {
            return null;
        }

        const { _chatOpen, _visible, _toolbarButtons } = this.props;
        const rootClassNames = `new-toolbox ${_visible ? 'visible' : ''} ${
            _toolbarButtons.length ? '' : 'no-buttons'} ${_chatOpen ? 'shift-right' : ''}`;

        return (
            <div
                className = { rootClassNames }
                id = 'new-toolbox'>
                { this._renderToolboxContent() }
            </div>
        );
    }

    /**
     * Key handler for overflow/hangup menus.
     *
     * @param {KeyboardEvent} e - Esc key click to close the popup.
     * @returns {void}
     */
    _onEscKey(e?: React.KeyboardEvent) {
        if (e?.key === 'Escape') {
            e?.stopPropagation();
            this._closeHangupMenuIfOpen();
            this._closeOverflowMenuIfOpen();
        }
    }

    /**
     * Closes the hangup menu if opened.
     *
     * @private
     * @returns {void}
     */
    _closeHangupMenuIfOpen() {
        const { dispatch, _hangupMenuVisible } = this.props;

        _hangupMenuVisible && dispatch(setHangupMenuVisible(false));
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
     * Dispatches an action to toggle the local participant's raised hand state.
     *
     * @private
     * @returns {void}
     */
    _doToggleRaiseHand() {
        const { _raisedHand } = this.props;

        this.props.dispatch(raiseHand(!_raisedHand));
    }

    /**
     * Dispatches an action to toggle screensharing.
     *
     * @private
     * @param {boolean} enabled - The state to toggle screen sharing to.
     * @param {boolean} audioOnly - Only share system audio.
     * @returns {void}
     */
    _doToggleScreenshare() {
        const {
            _desktopSharingButtonDisabled,
            _desktopSharingEnabled,
            _screenSharing,
            dispatch
        } = this.props;

        if (_desktopSharingEnabled && !_desktopSharingButtonDisabled) {
            dispatch(startScreenShareFlow(!_screenSharing));
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

    /**
     * Returns all buttons that could be rendered.
     *
     * @param {Object} state - The redux state.
     * @returns {Object} The button maps mainMenuButtons and overflowMenuButtons.
     */
    _getAllButtons() {
        const {
            _feedbackConfigured,
            _hasSalesforce,
            _isIosMobile,
            _isMobile,
            _isSpeakerStatsDisabled,
            _multiStreamModeEnabled,
            _screenSharing,
            _whiteboardEnabled
        } = this.props;

        const microphone = {
            key: 'microphone',
            Content: AudioSettingsButton,
            group: 0
        };

        const camera = {
            key: 'camera',
            Content: VideoSettingsButton,
            group: 0
        };

        const profile = this._isProfileVisible() && {
            key: 'profile',
            Content: ProfileButton,
            group: 1
        };

        const chat = {
            key: 'chat',
            Content: ChatButton,
            handleClick: this._onToolbarToggleChat,
            group: 2
        };

        const desktop = this._showDesktopSharingButton() && {
            key: 'desktop',
            Content: ShareDesktopButton,
            handleClick: this._onToolbarToggleScreenshare,
            group: 2
        };

        const raisehand = {
            key: 'raisehand',
            Content: ReactionsMenuButton,
            handleClick: this._onToolbarToggleRaiseHand,
            group: 2
        };

        const participants = {
            key: 'participants-pane',
            Content: ParticipantsPaneButton,
            handleClick: this._onToolbarToggleParticipantsPane,
            group: 2
        };

        const invite = {
            key: 'invite',
            Content: InviteButton,
            group: 2
        };

        const tileview = {
            key: 'tileview',
            Content: TileViewButton,
            group: 2
        };

        const toggleCamera = {
            key: 'toggle-camera',
            Content: ToggleCameraButton,
            group: 2
        };

        const videoQuality = {
            key: 'videoquality',
            Content: VideoQualityButton,
            handleClick: this._onToolbarOpenVideoQuality,
            group: 2
        };

        const fullscreen = !_isIosMobile && {
            key: 'fullscreen',
            Content: FullscreenButton,
            handleClick: this._onToolbarToggleFullScreen,
            group: 2
        };

        const security = {
            key: 'security',
            alias: 'info',
            Content: SecurityDialogButton,
            group: 2
        };

        const cc = {
            key: 'closedcaptions',
            Content: ClosedCaptionButton,
            group: 2
        };

        const recording = {
            key: 'recording',
            Content: RecordButton,
            group: 2
        };

        const livestreaming = {
            key: 'livestreaming',
            Content: LiveStreamButton,
            group: 2
        };

        const linkToSalesforce = _hasSalesforce && {
            key: 'linktosalesforce',
            Content: LinkToSalesforceButton,
            group: 2
        };

        const shareVideo = {
            key: 'sharedvideo',
            Content: SharedVideoButton,
            group: 3
        };

        const shareAudio = this._showAudioSharingButton() && {
            key: 'shareaudio',
            Content: ShareAudioButton,
            group: 3
        };

        const noiseSuppression = {
            key: 'noisesuppression',
            Content: NoiseSuppressionButton,
            group: 3
        };


        const whiteboard = _whiteboardEnabled && {
            key: 'whiteboard',
            Content: WhiteboardButton,
            group: 3
        };

        const etherpad = {
            key: 'etherpad',
            Content: SharedDocumentButton,
            group: 3
        };

        const virtualBackground = (_multiStreamModeEnabled || !_screenSharing) && {
            key: 'select-background',
            Content: VideoBackgroundButton,
            group: 3
        };

        const dockIframe = {
            key: 'dock-iframe',
            Content: DockIframeButton,
            group: 3
        };

        const undockIframe = {
            key: 'undock-iframe',
            Content: UndockIframeButton,
            group: 3
        };

        const speakerStats = !_isSpeakerStatsDisabled && {
            key: 'stats',
            Content: SpeakerStatsButton,
            group: 3
        };

        const settings = {
            key: 'settings',
            Content: SettingsButton,
            group: 4
        };

        const shortcuts = !_isMobile && keyboardShortcut.getEnabled() && {
            key: 'shortcuts',
            Content: KeyboardShortcutsButton,
            group: 4
        };

        const embed = this._isEmbedMeetingVisible() && {
            key: 'embedmeeting',
            Content: EmbedMeetingButton,
            group: 4
        };

        const feedback = _feedbackConfigured && {
            key: 'feedback',
            Content: FeedbackButton,
            group: 4
        };

        const download = {
            key: 'download',
            Content: DownloadButton,
            group: 4
        };

        const help = {
            key: 'help',
            Content: HelpButton,
            group: 4
        };

        return {
            microphone,
            camera,
            profile,
            desktop,
            chat,
            raisehand,
            participants,
            invite,
            tileview,
            toggleCamera,
            videoQuality,
            fullscreen,
            security,
            cc,
            recording,
            livestreaming,
            linkToSalesforce,
            shareVideo,
            shareAudio,
            noiseSuppression,
            whiteboard,
            etherpad,
            virtualBackground,
            dockIframe,
            undockIframe,
            speakerStats,
            settings,
            shortcuts,
            embed,
            feedback,
            download,
            help
        };
    }


    /**
     * Returns the notify mode of the given toolbox button.
     *
     * @param {string} btnName - The toolbar button's name.
     * @returns {string|undefined} - The button's notify mode.
     */
    _getButtonNotifyMode(btnName: string) {
        const notify = this.props._buttonsWithNotifyClick?.find(
            btn =>
                (typeof btn === 'string' && btn === btnName)
                || (typeof btn === 'object' && btn.key === btnName)
        );

        if (notify) {
            return typeof notify === 'string' || notify.preventExecution
                ? NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY
                : NOTIFY_CLICK_MODE.ONLY_NOTIFY;
        }
    }

    /**
     * Sets the notify click mode for the buttons.
     *
     * @param {Object} buttons - The list of toolbar buttons.
     * @returns {void}
     */
    _setButtonsNotifyClickMode(buttons: Object) {
        if (typeof APP === 'undefined' || !this.props._buttonsWithNotifyClick?.length) {
            return;
        }

        Object.values(buttons).forEach((button: any) => {
            if (typeof button === 'object') {
                button.notifyMode = this._getButtonNotifyMode(button.key);
            }
        });
    }

    /**
     * Returns all buttons that need to be rendered.
     *
     * @param {Object} state - The redux state.
     * @returns {Object} The visible buttons arrays .
     */
    _getVisibleButtons() {
        const {
            _clientWidth,
            _toolbarButtons,
            _jwtDisabledButons
        } = this.props;

        const buttons = this._getAllButtons();

        this._setButtonsNotifyClickMode(buttons);
        const isHangupVisible = isToolbarButtonEnabled('hangup', _toolbarButtons);
        const { order } = THRESHOLDS.find(({ width }) => _clientWidth > width)
            || THRESHOLDS[THRESHOLDS.length - 1];
        let sliceIndex = order.length + 2;

        const keys = Object.keys(buttons);

        const filtered = [
            ...order.map(key => buttons[key as keyof typeof buttons]),
            ...Object.values(buttons).filter((button, index) => !order.includes(keys[index]))
        ].filter(Boolean).filter(({ key, alias = NOT_APPLICABLE }) =>
            !_jwtDisabledButons.includes(key)
            && (isToolbarButtonEnabled(key, _toolbarButtons) || isToolbarButtonEnabled(alias, _toolbarButtons))
        );

        if (isHangupVisible) {
            sliceIndex -= 1;
        }

        // This implies that the overflow button will be displayed, so save some space for it.
        if (sliceIndex < filtered.length) {
            sliceIndex -= 1;
        }

        return {
            mainMenuButtons: filtered.slice(0, sliceIndex),
            overflowMenuButtons: filtered.slice(sliceIndex)
        };
    }

    /**
     * Dispatches an action signaling the toolbar is not being hovered.
     *
     * @private
     * @returns {void}
     */
    _onMouseOut() {
        const { _overflowMenuVisible, dispatch } = this.props;

        !_overflowMenuVisible && dispatch(setToolbarHovered(false));
    }

    /**
     * Dispatches an action signaling the toolbar is being hovered.
     *
     * @private
     * @returns {void}
     */
    _onMouseOver() {
        this.props.dispatch(setToolbarHovered(true));
    }

    /**
     * Sets the visibility of the hangup menu.
     *
     * @param {boolean} visible - Whether or not the hangup menu should be
     * displayed.
     * @private
     * @returns {void}
     */
    _onSetHangupVisible(visible: boolean) {
        this.props.dispatch(setHangupMenuVisible(visible));
        this.props.dispatch(setToolbarHovered(visible));
    }

    /**
     * Sets the visibility of the overflow menu.
     *
     * @param {boolean} visible - Whether or not the overflow menu should be
     * displayed.
     * @private
     * @returns {void}
     */
    _onSetOverflowVisible(visible: boolean) {
        this.props.dispatch(setOverflowMenuVisible(visible));
        this.props.dispatch(setToolbarHovered(visible));
    }

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
            ACTION_SHORTCUT_TRIGGERED,
            {
                enable: !this.props._chatOpen
            }));

        // Checks if there was any text selected by the user.
        // Used for when we press simultaneously keys for copying
        // text messages from the chat board
        if (window.getSelection()?.toString() !== '') {
            return false;
        }

        this._doToggleChat();
    }

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
            ACTION_SHORTCUT_TRIGGERED,
            {
                enable: !this.props._participantsPaneOpen
            }));

        this._onToolbarToggleParticipantsPane();
    }

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

    /**
     * Dispatches an action for toggling the tile view.
     *
     * @private
     * @returns {void}
     */
    _onShortcutToggleTileView() {
        sendAnalytics(createShortcutEvent(
            'toggle.tileview',
            ACTION_SHORTCUT_TRIGGERED,
            {
                enable: !this.props._tileViewEnabled
            }));

        this._doToggleTileView();
    }

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
            ACTION_SHORTCUT_TRIGGERED,
            {
                enable: !this.props._fullScreen
            }));

        this._doToggleFullScreen();
    }

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

    /**
     * Creates an analytics keyboard shortcut event and dispatches an action for
     * toggling screensharing.
     *
     * @private
     * @returns {void}
     */
    _onShortcutToggleScreenshare() {
        // Ignore the shortcut if the button is disabled.
        if (this.props._desktopSharingButtonDisabled) {
            return;
        }
        sendAnalytics(createShortcutEvent(
                'toggle.screen.sharing',
                ACTION_SHORTCUT_TRIGGERED,
                {
                    enable: !this.props._screenSharing
                }));

        this._doToggleScreenshare();
    }

    /**
     * Creates an analytics keyboard shortcut event and dispatches an action for
     * toggling speaker stats.
     *
     * @private
     * @returns {void}
     */
    _onShortcutSpeakerStats() {
        sendAnalytics(createShortcutEvent(
            'speaker.stats'
        ));

        this._doToggleSpekearStats();
    }

    /**
     * Dispatches an action to toggle speakerStats.
     *
     * @private
     * @returns {void}
     */
    _doToggleSpekearStats() {
        const { dispatch } = this.props;

        dispatch(toggleDialog(SpeakerStats, {
            conference: APP.conference
        }));
    }

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

    /**
     * Creates an analytics toolbar event and dispatches an action for toggling
     * screensharing.
     *
     * @private
     * @returns {void}
     */
    _onToolbarToggleScreenshare() {
        sendAnalytics(createToolbarEvent(
            'toggle.screen.sharing',
            { enable: !this.props._screenSharing }));

        this._closeOverflowMenuIfOpen();
        this._doToggleScreenshare();
    }

    /**
     * Returns true if the audio sharing button should be visible and
     * false otherwise.
     *
     * @returns {boolean}
     */
    _showAudioSharingButton() {
        const {
            _desktopSharingEnabled
        } = this.props;

        return _desktopSharingEnabled && isScreenAudioSupported();
    }

    /**
     * Returns true if the desktop sharing button should be visible and
     * false otherwise.
     *
     * @returns {boolean}
     */
    _showDesktopSharingButton() {
        return this.props._desktopSharingEnabled;
    }

    /**
     * Returns true if the embed meeting button is visible and false otherwise.
     *
     * @returns {boolean}
     */
    _isEmbedMeetingVisible() {
        return !this.props._isVpaasMeeting
            && !this.props._isMobile;
    }

    /**
     * Returns true if the profile button is visible and false otherwise.
     *
     * @returns {boolean}
     */
    _isProfileVisible() {
        return !this.props._isProfileDisabled;
    }

    /**
     * Renders the toolbox content.
     *
     * @returns {ReactElement}
     */
    _renderToolboxContent() {
        const {
            _endConferenceSupported,
            _hangupMenuVisible,
            _isMobile,
            _overflowDrawer,
            _overflowMenuVisible,
            _reactionsEnabled,
            _toolbarButtons,
            classes,
            t
        } = this.props;

        const toolbarAccLabel = 'toolbar.accessibilityLabel.moreActionsMenu';
        const containerClassName = `toolbox-content${_isMobile ? ' toolbox-content-mobile' : ''}`;

        const { mainMenuButtons, overflowMenuButtons } = this._getVisibleButtons();

        return (
            <div className = { containerClassName }>
                <div
                    className = 'toolbox-content-wrapper'
                    onFocus = { this._onTabIn }
                    { ...(_isMobile ? {} : {
                        onMouseOut: this._onMouseOut,
                        onMouseOver: this._onMouseOver
                    }) }>

                    <div className = 'toolbox-content-items'>
                        {mainMenuButtons.map(({ Content, key, ...rest }) => Content !== Separator && (
                            <Content
                                { ...rest }
                                buttonKey = { key }
                                key = { key } />))}

                        {Boolean(overflowMenuButtons.length) && (
                            <OverflowMenuButton
                                ariaControls = 'overflow-menu'
                                isOpen = { _overflowMenuVisible }
                                key = 'overflow-menu'
                                onVisibilityChange = { this._onSetOverflowVisible }
                                showMobileReactions = {
                                    _reactionsEnabled && overflowMenuButtons.find(({ key }) => key === 'raisehand')
                                }>
                                <ContextMenu
                                    accessibilityLabel = { t(toolbarAccLabel) }
                                    className = { classes.contextMenu }
                                    hidden = { false }
                                    inDrawer = { _overflowDrawer }
                                    onKeyDown = { this._onEscKey }>
                                    {overflowMenuButtons.reduce((acc, val) => {
                                        if (acc.length) {
                                            const prev = acc[acc.length - 1];
                                            const group = prev[prev.length - 1].group;

                                            if (group === val.group) {
                                                prev.push(val);
                                            } else {
                                                acc.push([ val ]);
                                            }
                                        } else {
                                            acc.push([ val ]);
                                        }

                                        return acc;
                                    }, []).map((buttonGroup: any) => (
                                        <ContextMenuItemGroup key = { `group-${buttonGroup[0].group}` }>
                                            {buttonGroup.map(({ key, Content, ...rest }: any) => (
                                                key !== 'raisehand' || !_reactionsEnabled)
                                                && <Content
                                                    { ...rest }
                                                    buttonKey = { key }
                                                    contextMenu = { true }
                                                    key = { key }
                                                    showLabel = { true } />)}
                                        </ContextMenuItemGroup>))}
                                </ContextMenu>
                            </OverflowMenuButton>
                        )}

                        { isToolbarButtonEnabled('hangup', _toolbarButtons) && (
                            _endConferenceSupported
                                ? <HangupMenuButton
                                    ariaControls = 'hangup-menu'
                                    isOpen = { _hangupMenuVisible }
                                    key = 'hangup-menu'
                                    onVisibilityChange = { this._onSetHangupVisible }>
                                    <ContextMenu
                                        accessibilityLabel = { t(toolbarAccLabel) }
                                        className = { classes.hangupMenu }
                                        hidden = { false }
                                        inDrawer = { _overflowDrawer }
                                        onKeyDown = { this._onEscKey }>
                                        <EndConferenceButton />
                                        <LeaveConferenceButton />
                                    </ContextMenu>
                                </HangupMenuButton>
                                : <HangupButton
                                    buttonKey = 'hangup'
                                    customClass = 'hangup-button'
                                    key = 'hangup-button'
                                    notifyMode = { this._getButtonNotifyMode('hangup') }
                                    visible = { isToolbarButtonEnabled('hangup', _toolbarButtons) } />
                        )}
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
 * @param {Object} ownProps - The props explicitly passed.
 * @private
 * @returns {{}}
 */
function _mapStateToProps(state: IReduxState, ownProps: Partial<IProps>) {
    const { conference } = state['features/base/conference'];
    const endConferenceSupported = conference?.isEndConferenceSupported();

    const {
        buttonsWithNotifyClick,
        callStatsID,
        disableProfile,
        iAmRecorder,
        iAmSipGateway
    } = state['features/base/config'];
    const {
        fullScreen,
        hangupMenuVisible,
        overflowMenuVisible,
        overflowDrawer
    } = state['features/toolbox'];
    const localParticipant = getLocalParticipant(state);
    const localVideo = getLocalVideoTrack(state['features/base/tracks']);
    const { clientWidth } = state['features/base/responsive-ui'];
    const toolbarButtons = ownProps.toolbarButtons || getToolbarButtons(state);

    return {
        _backgroundType: state['features/virtual-background'].backgroundType,
        _buttonsWithNotifyClick: buttonsWithNotifyClick,
        _chatOpen: state['features/chat'].isOpen,
        _clientWidth: clientWidth,
        _conference: conference,
        _desktopSharingEnabled: JitsiMeetJS.isDesktopSharingEnabled(),
        _desktopSharingButtonDisabled: isDesktopShareButtonDisabled(state),
        _dialog: Boolean(state['features/base/dialog'].component),
        _disabled: Boolean(iAmRecorder || iAmSipGateway),
        _endConferenceSupported: Boolean(endConferenceSupported),
        _feedbackConfigured: Boolean(callStatsID),
        _fullScreen: fullScreen,
        _gifsEnabled: isGifEnabled(state),
        _isProfileDisabled: Boolean(disableProfile),
        _isIosMobile: isIosMobileBrowser(),
        _isMobile: isMobileBrowser(),
        _isSpeakerStatsDisabled: isSpeakerStatsDisabled(state),
        _isVpaasMeeting: isVpaasMeeting(state),
        _jwtDisabledButons: getJwtDisabledButtons(state),
        _hasSalesforce: isSalesforceEnabled(state),
        _hangupMenuVisible: hangupMenuVisible,
        _localParticipantID: localParticipant?.id,
        _localVideo: localVideo,
        _multiStreamModeEnabled: getMultipleVideoSendingSupportFeatureFlag(state),
        _overflowMenuVisible: overflowMenuVisible,
        _overflowDrawer: overflowDrawer,
        _participantsPaneOpen: getParticipantsPaneOpen(state),
        _raisedHand: hasRaisedHand(localParticipant),
        _reactionsEnabled: isReactionsEnabled(state),
        _screenSharing: isScreenVideoShared(state),
        _tileViewEnabled: shouldDisplayTileView(state),
        _toolbarButtons: toolbarButtons,
        _virtualSource: state['features/virtual-background'].virtualSource,
        _visible: isToolboxVisible(state),
        _whiteboardEnabled: isWhiteboardButtonVisible(state)
    };
}

export default translate(connect(_mapStateToProps)(withStyles(styles)(Toolbox)));
