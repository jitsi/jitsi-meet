import { useEffect } from 'react';
import { batch, useDispatch, useSelector } from 'react-redux';

import { ACTION_SHORTCUT_TRIGGERED, createShortcutEvent } from '../analytics/AnalyticsEvents';
import { sendAnalytics } from '../analytics/functions';
import { IReduxState } from '../app/types';
import { toggleDialog } from '../base/dialog/actions';
import { isIosMobileBrowser, isIpadMobileBrowser } from '../base/environment/utils';
import { HELP_BUTTON_ENABLED } from '../base/flags/constants';
import { getFeatureFlag } from '../base/flags/functions';
import JitsiMeetJS from '../base/lib-jitsi-meet';
import { raiseHand } from '../base/participants/actions';
import { getLocalParticipant, hasRaisedHand } from '../base/participants/functions';
import { isToggleCameraEnabled } from '../base/tracks/functions.web';
import { toggleChat } from '../chat/actions.web';
import ChatButton from '../chat/components/web/ChatButton';
import { useEmbedButton } from '../embed-meeting/hooks';
import { useEtherpadButton } from '../etherpad/hooks';
import { useFeedbackButton } from '../feedback/hooks.web';
import { setGifMenuVisibility } from '../gifs/actions';
import { isGifEnabled } from '../gifs/function.any';
import InviteButton from '../invite/components/add-people-dialog/web/InviteButton';
import { registerShortcut, unregisterShortcut } from '../keyboard-shortcuts/actions';
import { useKeyboardShortcutsButton } from '../keyboard-shortcuts/hooks';
import NoiseSuppressionButton from '../noise-suppression/components/NoiseSuppressionButton';
import {
    close as closeParticipantsPane,
    open as openParticipantsPane
} from '../participants-pane/actions.web';
import {
    getParticipantsPaneOpen,
    isParticipantsPaneEnabled
} from '../participants-pane/functions';
import { useParticipantPaneButton } from '../participants-pane/hooks.web';
import { addReactionToBuffer } from '../reactions/actions.any';
import { toggleReactionsMenuVisibility } from '../reactions/actions.web';
import RaiseHandContainerButton from '../reactions/components/web/RaiseHandContainerButtons';
import { REACTIONS } from '../reactions/constants';
import { shouldDisplayReactionsButtons } from '../reactions/functions.any';
import { useReactionsButton } from '../reactions/hooks.web';
import { useLiveStreamingButton, useRecordingButton } from '../recording/hooks.web';
import { isSalesforceEnabled } from '../salesforce/functions';
import { startScreenShareFlow } from '../screen-share/actions.web';
import ShareAudioButton from '../screen-share/components/web/ShareAudioButton';
import { isScreenAudioSupported, isScreenVideoShared } from '../screen-share/functions';
import { useSecurityDialogButton } from '../security/hooks.web';
import SettingsButton from '../settings/components/web/SettingsButton';
import { useSharedVideoButton } from '../shared-video/hooks';
import SpeakerStats from '../speaker-stats/components/web/SpeakerStats';
import { isSpeakerStatsDisabled } from '../speaker-stats/functions';
import { useSpeakerStatsButton } from '../speaker-stats/hooks.web';
import { useClosedCaptionButton } from '../subtitles/hooks.web';
import { toggleTileView } from '../video-layout/actions.any';
import { shouldDisplayTileView } from '../video-layout/functions.web';
import { useTileViewButton } from '../video-layout/hooks';
import VideoQualityButton from '../video-quality/components/VideoQualityButton.web';
import VideoQualityDialog from '../video-quality/components/VideoQualityDialog.web';
import { useVirtualBackgroundButton } from '../virtual-background/hooks';
import { useWhiteboardButton } from '../whiteboard/hooks';

import { setFullScreen } from './actions.web';
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
import { isButtonEnabled, isDesktopShareButtonDisabled } from './functions.web';
import { ICustomToolbarButton, IToolboxButton, ToolbarButton } from './types';


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

const invite = {
    key: 'invite',
    Content: InviteButton,
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

const linkToSalesforce = {
    key: 'linktosalesforce',
    Content: LinkToSalesforceButton,
    group: 2
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

const settings = {
    key: 'settings',
    Content: SettingsButton,
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

/**
 * A hook that returns the toggle camera button if it is enabled and undefined otherwise.
 *
 *  @returns {Object | undefined}
 */
function useToggleCameraButton() {
    const toggleCameraEnabled = useSelector(isToggleCameraEnabled);

    if (toggleCameraEnabled) {
        return toggleCamera;
    }
}

/**
 * A hook that returns the desktop sharing button if it is enabled and undefined otherwise.
 *
 *  @returns {Object | undefined}
 */
function getDesktopSharingButton() {
    if (JitsiMeetJS.isDesktopSharingEnabled()) {
        return desktop;
    }
}

/**
 * A hook that returns the fullscreen button if it is enabled and undefined otherwise.
 *
 *  @returns {Object | undefined}
 */
function getFullscreenButton() {
    if (!isIosMobileBrowser() || isIpadMobileBrowser()) {
        return fullscreen;
    }
}

/**
 * A hook that returns the "link to salesforce" button if it is enabled and undefined otherwise.
 *
 *  @returns {Object | undefined}
 */
function useLinkToSalesforceButton() {
    const _isSalesforceEnabled = useSelector(isSalesforceEnabled);

    if (_isSalesforceEnabled) {
        return linkToSalesforce;
    }
}


/**
 * A hook that returns the share audio button if it is enabled and undefined otherwise.
 *
 *  @returns {Object | undefined}
 */
function getShareAudioButton() {
    if (JitsiMeetJS.isDesktopSharingEnabled() && isScreenAudioSupported()) {
        return shareAudio;
    }
}

/**
 * A hook that returns the download button if it is enabled and undefined otherwise.
 *
 *  @returns {Object | undefined}
 */
function useDownloadButton() {
    const visible = useSelector(
        (state: IReduxState) => typeof state['features/base/config'].deploymentUrls?.downloadAppsUrl === 'string');

    if (visible) {
        return download;
    }
}

/**
 * A hook that returns the help button if it is enabled and undefined otherwise.
 *
 *  @returns {Object | undefined}
 */
function useHelpButton() {
    const visible = useSelector(
        (state: IReduxState) =>
            typeof state['features/base/config'].deploymentUrls?.userDocumentationURL === 'string'
                && getFeatureFlag(state, HELP_BUTTON_ENABLED, true));

    if (visible) {
        return help;
    }
}

/**
* Returns all buttons that could be rendered.
*
* @param {Object} _customToolbarButtons - An array containing custom buttons objects.
* @returns {Object} The button maps mainMenuButtons and overflowMenuButtons.
*/
export function useToolboxButtons(
        _customToolbarButtons?: ICustomToolbarButton[]): { [key: string]: IToolboxButton; } {
    const desktopSharing = getDesktopSharingButton();
    const toggleCameraButton = useToggleCameraButton();
    const _fullscreen = getFullscreenButton();
    const security = useSecurityDialogButton();
    const reactions = useReactionsButton();
    const participants = useParticipantPaneButton();
    const tileview = useTileViewButton();
    const cc = useClosedCaptionButton();
    const recording = useRecordingButton();
    const liveStreaming = useLiveStreamingButton();
    const linktosalesforce = useLinkToSalesforceButton();
    const shareaudio = getShareAudioButton();
    const shareVideo = useSharedVideoButton();
    const whiteboard = useWhiteboardButton();
    const etherpad = useEtherpadButton();
    const virtualBackground = useVirtualBackgroundButton();
    const speakerStats = useSpeakerStatsButton();
    const shortcuts = useKeyboardShortcutsButton();
    const embed = useEmbedButton();
    const feedback = useFeedbackButton();
    const _download = useDownloadButton();
    const _help = useHelpButton();

    const buttons: { [key in ToolbarButton]?: IToolboxButton; } = {
        microphone,
        camera,
        profile,
        desktop: desktopSharing,
        chat,
        raisehand,
        reactions,
        'participants-pane': participants,
        invite,
        tileview,
        'toggle-camera': toggleCameraButton,
        videoquality: videoQuality,
        fullscreen: _fullscreen,
        security,
        closedcaptions: cc,
        recording,
        livestreaming: liveStreaming,
        linktosalesforce,
        sharedvideo: shareVideo,
        shareaudio,
        noisesuppression: noiseSuppression,
        whiteboard,
        etherpad,
        'select-background': virtualBackground,
        stats: speakerStats,
        settings,
        shortcuts,
        embedmeeting: embed,
        feedback,
        download: _download,
        help: _help
    };
    const buttonKeys = Object.keys(buttons) as ToolbarButton[];

    buttonKeys.forEach(
            key => typeof buttons[key] === 'undefined' && delete buttons[key]);

    const customButtons = _customToolbarButtons?.reduce((prev, { backgroundColor, icon, id, text }) => {
        prev[id] = {
            backgroundColor,
            key: id,
            id,
            Content: CustomOptionButton,
            group: 4,
            icon,
            text
        };

        return prev;
    }, {} as { [key: string]: ICustomToolbarButton; });

    return {
        ...buttons,
        ...customButtons
    };
}


export const useKeyboardShortcuts = (toolbarButtons: Array<string>) => {
    const dispatch = useDispatch();
    const _isSpeakerStatsDisabled = useSelector(isSpeakerStatsDisabled);
    const _isParticipantsPaneEnabled = useSelector(isParticipantsPaneEnabled);
    const _shouldDisplayReactionsButtons = useSelector(shouldDisplayReactionsButtons);
    const _toolbarButtons = useSelector(
        (state: IReduxState) => toolbarButtons || state['features/toolbox'].toolbarButtons);
    const chatOpen = useSelector((state: IReduxState) => state['features/chat'].isOpen);
    const desktopSharingButtonDisabled = useSelector(isDesktopShareButtonDisabled);
    const desktopSharingEnabled = JitsiMeetJS.isDesktopSharingEnabled();
    const fullScreen = useSelector((state: IReduxState) => state['features/toolbox'].fullScreen);
    const gifsEnabled = useSelector(isGifEnabled);
    const participantsPaneOpen = useSelector(getParticipantsPaneOpen);
    const raisedHand = useSelector((state: IReduxState) => hasRaisedHand(getLocalParticipant(state)));
    const screenSharing = useSelector(isScreenVideoShared);
    const tileViewEnabled = useSelector(shouldDisplayTileView);

    /**
     * Creates an analytics keyboard shortcut event and dispatches an action for
     * toggling the display of chat.
     *
     * @private
     * @returns {void}
     */
    function onToggleChat() {
        sendAnalytics(createShortcutEvent(
            'toggle.chat',
            ACTION_SHORTCUT_TRIGGERED,
            {
                enable: !chatOpen
            }));

        // Checks if there was any text selected by the user.
        // Used for when we press simultaneously keys for copying
        // text messages from the chat board
        if (window.getSelection()?.toString() !== '') {
            return false;
        }

        dispatch(toggleChat());
    }

    /**
     * Creates an analytics keyboard shortcut event and dispatches an action for
     * toggling the display of the participants pane.
     *
     * @private
     * @returns {void}
     */
    function onToggleParticipantsPane() {
        sendAnalytics(createShortcutEvent(
            'toggle.participants-pane',
            ACTION_SHORTCUT_TRIGGERED,
            {
                enable: !participantsPaneOpen
            }));

        if (participantsPaneOpen) {
            dispatch(closeParticipantsPane());
        } else {
            dispatch(openParticipantsPane());
        }
    }

    /**
    * Creates an analytics keyboard shortcut event and dispatches an action for
    * toggling the display of Video Quality.
    *
    * @private
    * @returns {void}
    */
    function onToggleVideoQuality() {
        sendAnalytics(createShortcutEvent('video.quality'));

        dispatch(toggleDialog(VideoQualityDialog));
    }

    /**
     * Dispatches an action for toggling the tile view.
     *
     * @private
     * @returns {void}
     */
    function onToggleTileView() {
        sendAnalytics(createShortcutEvent(
            'toggle.tileview',
            ACTION_SHORTCUT_TRIGGERED,
            {
                enable: !tileViewEnabled
            }));

        dispatch(toggleTileView());
    }

    /**
     * Creates an analytics keyboard shortcut event and dispatches an action for
     * toggling full screen mode.
     *
     * @private
     * @returns {void}
     */
    function onToggleFullScreen() {
        sendAnalytics(createShortcutEvent(
            'toggle.fullscreen',
            ACTION_SHORTCUT_TRIGGERED,
            {
                enable: !fullScreen
            }));
        dispatch(setFullScreen(!fullScreen));
    }

    /**
     * Creates an analytics keyboard shortcut event and dispatches an action for
     * toggling raise hand.
     *
     * @private
     * @returns {void}
     */
    function onToggleRaiseHand() {
        sendAnalytics(createShortcutEvent(
            'toggle.raise.hand',
            ACTION_SHORTCUT_TRIGGERED,
            { enable: !raisedHand }));

        dispatch(raiseHand(!raisedHand));
    }

    /**
     * Creates an analytics keyboard shortcut event and dispatches an action for
     * toggling screensharing.
     *
     * @private
     * @returns {void}
     */
    function onToggleScreenshare() {
        // Ignore the shortcut if the button is disabled.
        if (desktopSharingButtonDisabled) {
            return;
        }
        sendAnalytics(createShortcutEvent(
            'toggle.screen.sharing',
            ACTION_SHORTCUT_TRIGGERED,
            {
                enable: !screenSharing
            }));

        if (desktopSharingEnabled && !desktopSharingButtonDisabled) {
            dispatch(startScreenShareFlow(!screenSharing));
        }
    }

    /**
     * Creates an analytics keyboard shortcut event and dispatches an action for
     * toggling speaker stats.
     *
     * @private
     * @returns {void}
     */
    function onSpeakerStats() {
        sendAnalytics(createShortcutEvent(
            'speaker.stats'
        ));

        dispatch(toggleDialog(SpeakerStats, {
            conference: APP.conference
        }));
    }

    useEffect(() => {
        const KEYBOARD_SHORTCUTS = [
            isButtonEnabled('videoquality', _toolbarButtons) && {
                character: 'A',
                exec: onToggleVideoQuality,
                helpDescription: 'toolbar.callQuality'
            },
            isButtonEnabled('chat', _toolbarButtons) && {
                character: 'C',
                exec: onToggleChat,
                helpDescription: 'keyboardShortcuts.toggleChat'
            },
            isButtonEnabled('desktop', _toolbarButtons) && {
                character: 'D',
                exec: onToggleScreenshare,
                helpDescription: 'keyboardShortcuts.toggleScreensharing'
            },
            _isParticipantsPaneEnabled && isButtonEnabled('participants-pane', _toolbarButtons) && {
                character: 'P',
                exec: onToggleParticipantsPane,
                helpDescription: 'keyboardShortcuts.toggleParticipantsPane'
            },
            isButtonEnabled('raisehand', _toolbarButtons) && {
                character: 'R',
                exec: onToggleRaiseHand,
                helpDescription: 'keyboardShortcuts.raiseHand'
            },
            isButtonEnabled('fullscreen', _toolbarButtons) && {
                character: 'S',
                exec: onToggleFullScreen,
                helpDescription: 'keyboardShortcuts.fullScreen'
            },
            isButtonEnabled('tileview', _toolbarButtons) && {
                character: 'W',
                exec: onToggleTileView,
                helpDescription: 'toolbar.tileViewToggle'
            },
            !_isSpeakerStatsDisabled && isButtonEnabled('stats', _toolbarButtons) && {
                character: 'T',
                exec: onSpeakerStats,
                helpDescription: 'keyboardShortcuts.showSpeakerStats'
            }
        ];

        KEYBOARD_SHORTCUTS.forEach(shortcut => {
            if (typeof shortcut === 'object') {
                dispatch(registerShortcut({
                    character: shortcut.character,
                    handler: shortcut.exec,
                    helpDescription: shortcut.helpDescription
                }));
            }
        });

        // If the buttons for sending reactions are not displayed we should disable the shortcuts too.
        if (_shouldDisplayReactionsButtons) {
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
                    helpDescription: `toolbar.reaction${key.charAt(0).toUpperCase()}${key.slice(1)}`,
                    altKey: true
                };
            });

            REACTION_SHORTCUTS.forEach(shortcut => {
                dispatch(registerShortcut({
                    alt: shortcut.altKey,
                    character: shortcut.character,
                    handler: shortcut.exec,
                    helpDescription: shortcut.helpDescription
                }));
            });

            if (gifsEnabled) {
                const onGifShortcut = () => {
                    batch(() => {
                        dispatch(toggleReactionsMenuVisibility());
                        dispatch(setGifMenuVisibility(true));
                    });
                };

                dispatch(registerShortcut({
                    character: 'G',
                    handler: onGifShortcut,
                    helpDescription: 'keyboardShortcuts.giphyMenu'
                }));
            }
        }

        return () => {
            [ 'A', 'C', 'D', 'P', 'R', 'S', 'W', 'T', 'G' ].forEach(letter =>
                dispatch(unregisterShortcut(letter)));

            if (_shouldDisplayReactionsButtons) {
                Object.keys(REACTIONS).map(key => REACTIONS[key].shortcutChar)
                    .forEach(letter =>
                        dispatch(unregisterShortcut(letter, true)));
            }
        };
    }, [
        _shouldDisplayReactionsButtons,
        chatOpen,
        desktopSharingButtonDisabled,
        desktopSharingEnabled,
        fullScreen,
        gifsEnabled,
        participantsPaneOpen,
        raisedHand,
        screenSharing,
        tileViewEnabled
    ]);
};
