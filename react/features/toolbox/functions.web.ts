import { IReduxState } from '../app/types';
import { getToolbarButtons } from '../base/config/functions.web';
import { hasAvailableDevices } from '../base/devices/functions';
import { MEET_FEATURES } from '../base/jwt/constants';
import { isJwtFeatureEnabled } from '../base/jwt/functions';
import { IGUMPendingState } from '../base/media/types';
import ChatButton from '../chat/components/web/ChatButton';
import EmbedMeetingButton from '../embed-meeting/components/EmbedMeetingButton';
import SharedDocumentButton from '../etherpad/components/SharedDocumentButton.web';
import FeedbackButton from '../feedback/components/FeedbackButton.web';
import InviteButton from '../invite/components/add-people-dialog/web/InviteButton';
import KeyboardShortcutsButton from '../keyboard-shortcuts/components/web/KeyboardShortcutsButton';
import NoiseSuppressionButton from '../noise-suppression/components/NoiseSuppressionButton';
import ParticipantsPaneButton from '../participants-pane/components/web/ParticipantsPaneButton';
import RaiseHandContainerButton from '../reactions/components/web/RaiseHandContainerButtons';
import ReactionsMenuButton from '../reactions/components/web/ReactionsMenuButton';
import LiveStreamButton from '../recording/components/LiveStream/web/LiveStreamButton';
import RecordButton from '../recording/components/Recording/web/RecordButton';
import ShareAudioButton from '../screen-share/components/web/ShareAudioButton';
import { isScreenMediaShared } from '../screen-share/functions';
import SecurityDialogButton from '../security/components/security-dialog/web/SecurityDialogButton';
import SettingsButton from '../settings/components/web/SettingsButton';
import SharedVideoButton from '../shared-video/components/web/SharedVideoButton';
import SpeakerStatsButton from '../speaker-stats/components/web/SpeakerStatsButton';
import ClosedCaptionButton from '../subtitles/components/web/ClosedCaptionButton';
import TileViewButton from '../video-layout/components/TileViewButton';
import VideoQualityButton from '../video-quality/components/VideoQualityButton.web';
import VideoBackgroundButton from '../virtual-background/components/VideoBackgroundButton';
import WhiteboardButton from '../whiteboard/components/web/WhiteboardButton';
import { isWhiteboardVisible } from '../whiteboard/functions';

import DownloadButton from './components/DownloadButton';
import HelpButton from './components/HelpButton';
import AudioSettingsButton from './components/web/AudioSettingsButton';
import CustomOptionButton from './components/web/CustomOptionButton';
import FullscreenButton from './components/web/FullscreenButton';
import LinkToSalesforceButton from './components/web/LinkToSalesforceButton';
import ProfileButton from './components/web/ProfileButton';
import ShareDesktopButton from './components/web/ShareDesktopButton';
import ToggleCameraButton from './components/web/ToggleCameraButton';
import VideoSettingsButton from './components/web/VideoSettingsButton';
import { TOOLBAR_TIMEOUT } from './constants';
import { IToolboxButton } from './types';

export * from './functions.any';

/**
 * Helper for getting the height of the toolbox.
 *
 * @returns {number} The height of the toolbox.
 */
export function getToolboxHeight() {
    const toolbox = document.getElementById('new-toolbox');

    return toolbox?.clientHeight || 0;
}

/**
 * Indicates if a toolbar button is enabled.
 *
 * @param {string} name - The name of the setting section as defined in
 * interface_config.js.
 * @param {IReduxState} state - The redux state.
 * @returns {boolean|undefined} - True to indicate that the given toolbar button
 * is enabled, false - otherwise.
 */
export function isButtonEnabled(name: string, state: IReduxState) {
    const toolbarButtons = getToolbarButtons(state);

    return toolbarButtons.indexOf(name) !== -1;
}

/**
 * Indicates if the toolbox is visible or not.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean} - True to indicate that the toolbox is visible, false -
 * otherwise.
 */
export function isToolboxVisible(state: IReduxState) {
    const { iAmRecorder, iAmSipGateway, toolbarConfig } = state['features/base/config'];
    const { alwaysVisible } = toolbarConfig || {};
    const {
        timeoutID,
        visible
    } = state['features/toolbox'];
    const { audioSettingsVisible, videoSettingsVisible } = state['features/settings'];
    const whiteboardVisible = isWhiteboardVisible(state);

    return Boolean(!iAmRecorder && !iAmSipGateway
            && (
                timeoutID
                || visible
                || alwaysVisible
                || audioSettingsVisible
                || videoSettingsVisible
                || whiteboardVisible
            ));
}

/**
 * Indicates if the audio settings button is disabled or not.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export function isAudioSettingsButtonDisabled(state: IReduxState) {

    return !(hasAvailableDevices(state, 'audioInput')
        || hasAvailableDevices(state, 'audioOutput'))
        || state['features/base/config'].startSilent;
}

/**
 * Indicates if the desktop share button is disabled or not.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export function isDesktopShareButtonDisabled(state: IReduxState) {
    const { muted, unmuteBlocked } = state['features/base/media'].video;
    const videoOrShareInProgress = !muted || isScreenMediaShared(state);
    const enabledInJwt = isJwtFeatureEnabled(state, MEET_FEATURES.SCREEN_SHARING, true, true);

    return !enabledInJwt || (unmuteBlocked && !videoOrShareInProgress);
}

/**
 * Indicates if the video settings button is disabled or not.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export function isVideoSettingsButtonDisabled(state: IReduxState) {
    return !hasAvailableDevices(state, 'videoInput');
}

/**
 * Indicates if the video mute button is disabled or not.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export function isVideoMuteButtonDisabled(state: IReduxState) {
    const { muted, unmuteBlocked, gumPending } = state['features/base/media'].video;

    return !hasAvailableDevices(state, 'videoInput')
        || (unmuteBlocked && Boolean(muted))
        || gumPending !== IGUMPendingState.NONE;
}

/**
 * If an overflow drawer should be displayed or not.
 * This is usually done for mobile devices or on narrow screens.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export function showOverflowDrawer(state: IReduxState) {
    return state['features/toolbox'].overflowDrawer;
}

/**
 * Returns true if the overflow menu button is displayed and false otherwise.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean} - True if the overflow menu button is displayed and false otherwise.
 */
export function showOverflowMenu(state: IReduxState) {
    return state['features/toolbox'].overflowMenuVisible;
}

/**
 * Indicates whether the toolbox is enabled or not.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export function isToolboxEnabled(state: IReduxState) {
    return state['features/toolbox'].enabled;
}

/**
 * Returns the toolbar timeout from config or the default value.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {number} - Toolbar timeout in milliseconds.
 */
export function getToolbarTimeout(state: IReduxState) {
    const { toolbarConfig } = state['features/base/config'];

    return toolbarConfig?.timeout || TOOLBAR_TIMEOUT;
}

/**
    * Returns all buttons that could be rendered.
    *
    * @param {Object} _customToolbarButtons - An array containing custom buttons objects.
    * @returns {Object} The button maps mainMenuButtons and overflowMenuButtons.
    */
export function getAllToolboxButtons(_customToolbarButtons?: {
    backgroundColor?: string;
    icon: string;
    id: string;
    text: string;
    }[]): { [key: string]: IToolboxButton; } {

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

    const profile = {
        key: 'profile',
        Content: ProfileButton,
        group: 1
    };

    const chat = {
        key: 'chat',
        Content: ChatButton,
        group: 2
    };

    const desktop = {
        key: 'desktop',
        Content: ShareDesktopButton,
        group: 2
    };

    // In Narrow layout and mobile web we are using drawer for popups and that is why it is better to include
    // all forms of reactions in the overflow menu. Otherwise the toolbox will be hidden and the reactions popup
    // misaligned.
    const raisehand = {
        key: 'raisehand',
        Content: RaiseHandContainerButton,
        group: 2
    };

    const reactions = {
        key: 'reactions',
        Content: ReactionsMenuButton,
        group: 2
    };

    const participants = {
        key: 'participants-pane',
        Content: ParticipantsPaneButton,
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
        group: 2
    };

    const fullscreen = {
        key: 'fullscreen',
        Content: FullscreenButton,
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

    const linkToSalesforce = {
        key: 'linktosalesforce',
        Content: LinkToSalesforceButton,
        group: 2
    };

    const shareVideo = {
        key: 'sharedvideo',
        Content: SharedVideoButton,
        group: 3
    };

    const shareAudio = {
        key: 'shareaudio',
        Content: ShareAudioButton,
        group: 3
    };

    const noiseSuppression = {
        key: 'noisesuppression',
        Content: NoiseSuppressionButton,
        group: 3
    };


    const whiteboard = {
        key: 'whiteboard',
        Content: WhiteboardButton,
        group: 3
    };

    const etherpad = {
        key: 'etherpad',
        Content: SharedDocumentButton,
        group: 3
    };

    const virtualBackground = {
        key: 'select-background',
        Content: VideoBackgroundButton,
        group: 3
    };

    const speakerStats = {
        key: 'stats',
        Content: SpeakerStatsButton,
        group: 3
    };

    const settings = {
        key: 'settings',
        Content: SettingsButton,
        group: 4
    };

    const shortcuts = {
        key: 'shortcuts',
        Content: KeyboardShortcutsButton,
        group: 4
    };

    const embed = {
        key: 'embedmeeting',
        Content: EmbedMeetingButton,
        group: 4
    };

    const feedback = {
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

    const customButtons = _customToolbarButtons?.reduce((prev, { backgroundColor, icon, id, text }) => {
        return {
            ...prev,
            [id]: {
                backgroundColor,
                key: id,
                Content: CustomOptionButton,
                group: 4,
                icon,
                text
            }
        };
    }, {});

    return {
        microphone,
        camera,
        profile,
        desktop,
        chat,
        raisehand,
        reactions,
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
        speakerStats,
        settings,
        shortcuts,
        embed,
        feedback,
        download,
        help,
        ...customButtons
    };
}
