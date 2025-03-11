import { ComponentType } from 'react';

export interface IToolboxButton {
    Content: ComponentType<any>;
    group: number;
    key: string;
}

export interface IToolboxNativeButton {
    Content: ComponentType<any>;
    backgroundColor?: string;
    group: number;
    icon?: string;
    id?: string;
    key: string;
    text?: string;
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
    'overflowmenu' |
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
    order: Array<ToolbarButton | NativeToolbarButton | string>;
    width: number;
}>;

export interface ICustomToolbarButton {
    Content?: ComponentType<any>;
    backgroundColor?: string;
    group?: number;
    icon: string;
    id: string;
    key?: string;
    text: string;
}

export type NativeToolbarButton = 'camera' |
    'chat' |
    'microphone' |
    'raisehand' |
    'screensharing' |
    'tileview' |
    'overflowmenu' |
    'hangup';

export interface IGetVisibleNativeButtonsParams {
    allButtons: { [key: string]: IToolboxNativeButton; };
    clientWidth: number;
    mainToolbarButtonsThresholds: IMainToolbarButtonThresholds;
    toolbarButtons: string[];
}

export interface IGetVisibleButtonsParams {
    allButtons: { [key: string]: IToolboxButton; };
    buttonsWithNotifyClick: Map<string, NOTIFY_CLICK_MODE>;
    clientWidth: number;
    jwtDisabledButtons: string[];
    mainToolbarButtonsThresholds: IMainToolbarButtonThresholds;
    toolbarButtons: string[];
}
