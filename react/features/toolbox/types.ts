import { ComponentType } from 'react';

export interface IToolboxButton {
    Content: ComponentType<any>;
    alias?: string;
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
