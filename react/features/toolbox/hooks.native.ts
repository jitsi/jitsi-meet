import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import ChatButton from '../chat/components/native/ChatButton';
import RaiseHandContainerButtons from '../reactions/components/native/RaiseHandContainerButtons';
import TileViewButton from '../video-layout/components/TileViewButton';
import { iAmVisitor } from '../visitors/functions';

import { useCustomPanelButton } from '../custom-panel/hooks.native';

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
    key: 'desktop',
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
 * Returns all buttons that could be rendered.
 *
 * @param {Object} _customToolbarButtons - An array containing custom buttons objects.
 * @returns {Object} The button maps mainMenuButtons and overflowMenuButtons.
 */
export function useNativeToolboxButtons(
        _customToolbarButtons?: ICustomToolbarButton[]): { [key: string]: IToolboxNativeButton; } {
    const _iAmVisitor = useSelector(iAmVisitor);
    const _isScreenShareButtonDisabled = useSelector(isDesktopShareButtonDisabled);
    const customPanel = useCustomPanelButton();

    return useMemo(() => {
        const buttons: { [key in NativeToolbarButton]?: IToolboxNativeButton; } = {
            chat,
            raisehand,
            tileview,
            overflowmenu,
            hangup
        };

        if (!_iAmVisitor) {
            buttons.microphone = microphone;
            buttons.camera = camera;

            if (!_isScreenShareButtonDisabled) {
                buttons.desktop = screensharing;
            }
        }

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
            ...customButtons,
            ...(customPanel ? { 'custom-panel': customPanel } : {})
        };
    }, [ _iAmVisitor, _isScreenShareButtonDisabled, _customToolbarButtons, customPanel ]);
}
