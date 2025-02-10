import { useSelector } from 'react-redux';

import ChatButton from '../chat/components/native/ChatButton';
import RaiseHandContainerButtons from '../reactions/components/native/RaiseHandContainerButtons';
import TileViewButton from '../video-layout/components/TileViewButton';
import { iAmVisitor } from '../visitors/functions';

import AudioMuteButton from './components/native/AudioMuteButton';
import CustomOptionButton from './components/native/CustomOptionButton';
import HangupContainerButtons from './components/native/HangupContainerButtons';
import OverflowMenuButton from './components/native/OverflowMenuButton';
import ScreenSharingButton from './components/native/ScreenSharingButton';
import VideoMuteButton from './components/native/VideoMuteButton';
import { isDesktopShareButtonDisabled } from './functions.native';
import { ICustomToolbarButton, IToolboxNativeButton, NativeToolbarButton } from './types';


const microphone = {
    key: 'microphone',
    Content: AudioMuteButton,
    group: 0
};

const camera = {
    key: 'camera',
    Content: VideoMuteButton,
    group: 0
};

const chat = {
    key: 'chat',
    Content: ChatButton,
    group: 1
};

const screensharing = {
    key: 'screensharing',
    Content: ScreenSharingButton,
    group: 1
};

const raisehand = {
    key: 'raisehand',
    Content: RaiseHandContainerButtons,
    group: 2
};

const tileview = {
    key: 'tileview',
    Content: TileViewButton,
    group: 2
};

const overflowmenu = {
    key: 'overflowmenu',
    Content: OverflowMenuButton,
    group: 3
};

const hangup = {
    key: 'hangup',
    Content: HangupContainerButtons,
    group: 3
};

/**
 * A hook that returns the audio mute button.
 *
 *  @returns {Object | undefined}
 */
function getAudioMuteButton() {
    const _iAmVisitor = useSelector(iAmVisitor);

    if (!_iAmVisitor) {
        return microphone;
    }
}

/**
 * A hook that returns the video mute button.
 *
 *  @returns {Object | undefined}
 */
function getVideoMuteButton() {
    const _iAmVisitor = useSelector(iAmVisitor);

    if (!_iAmVisitor) {
        return camera;
    }
}

/**
 * A hook that returns the chat button.
 *
 *  @returns {Object | undefined}
 */
function getChatButton() {
    const _iAmVisitor = useSelector(iAmVisitor);

    if (!_iAmVisitor) {
        return chat;
    }
}

/**
 * A hook that returns the screen sharing button.
 *
 *  @returns {Object | undefined}
 */
function getScreenSharingButton() {
    const _iAmVisitor = useSelector(iAmVisitor);
    const _isScreenShareButtonDisabled = useSelector(isDesktopShareButtonDisabled);

    if (!_isScreenShareButtonDisabled && !_iAmVisitor) {
        return screensharing;
    }
}

/**
 * A hook that returns the tile view button.
 *
 *  @returns {Object | undefined}
 */
function getTileViewButton() {
    const _iAmVisitor = useSelector(iAmVisitor);

    if (!_iAmVisitor) {
        return tileview;
    }
}

/**
 * A hook that returns the overflow menu button.
 *
 *  @returns {Object | undefined}
 */
function getOverflowMenuButton() {
    const _iAmVisitor = useSelector(iAmVisitor);

    if (!_iAmVisitor) {
        return overflowmenu;
    }
}

/**
 * Returns all buttons that could be rendered.
 *
 * @param {Object} _customToolbarButtons - An array containing custom buttons objects.
 * @returns {Object} The button maps mainMenuButtons and overflowMenuButtons.
 */
export function useNativeToolboxButtons(
        _customToolbarButtons?: ICustomToolbarButton[]): { [key: string]: IToolboxNativeButton; } {
    const audioMuteButton = getAudioMuteButton();
    const videoMuteButton = getVideoMuteButton();
    const chatButton = getChatButton();
    const screenSharingButton = getScreenSharingButton();
    const tileViewButton = getTileViewButton();
    const overflowMenuButton = getOverflowMenuButton();

    const buttons: { [key in NativeToolbarButton]?: IToolboxNativeButton; } = {
        microphone: audioMuteButton,
        camera: videoMuteButton,
        chat: chatButton,
        screensharing: screenSharingButton,
        raisehand,
        tileview: tileViewButton,
        overflowmenu: overflowMenuButton,
        hangup
    };
    const buttonKeys = Object.keys(buttons) as NativeToolbarButton[];

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
