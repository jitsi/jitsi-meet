import { ComponentType } from 'react';

import { CustomOptionButton } from './components';

export interface IToolboxButton {
    Content: ComponentType<any>;
    group: number;
    key: string;
}

export type ToolbarButton = 'camera' |
    'chat' |
    'closedcaptions' |
    'desktop' |
    'download' |
    'embedmeeting' |
    'etherpad' |
    'feedback' |
    'filmstrip' |
    'fullscreen' |
    'hangup' |
    'help' |
    'highlight' |
    'invite' |
    'linktosalesforce' |
    'livestreaming' |
    'microphone' |
    'mute-everyone' |
    'mute-video-everyone' |
    'noisesuppression' |
    'participants-pane' |
    'profile' |
    'raisehand' |
    'reactions' |
    'recording' |
    'security' |
    'select-background' |
    'settings' |
    'shareaudio' |
    'sharedvideo' |
    'shortcuts' |
    'stats' |
    'tileview' |
    'toggle-camera' |
    'videoquality' |
    'whiteboard' |
    '__end';

export enum NOTIFY_CLICK_MODE {
    ONLY_NOTIFY = 'ONLY_NOTIFY',
    PREVENT_AND_NOTIFY = 'PREVENT_AND_NOTIFY'
}

export type IMainToolbarButtonThresholds = Array<{
    order: Array<ToolbarButton | string>;
    width: number;
}>;

export interface ICustomToolbarButton {
    Content?: typeof CustomOptionButton;
    backgroundColor?: string;
    group?: number;
    icon: string;
    id: string;
    key?: string;
    text: string;
}
