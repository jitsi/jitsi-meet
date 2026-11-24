import {
    IconMic,
    IconMicSlash,
    IconVideo,
    IconVideoOff
} from '../base/icons/svg';

/**
 * Reducer key for the feature.
 */
export const REDUCER_KEY = 'features/participants-pane';

export type ActionTrigger = 'Hover' | 'Permanent';

/**
 * Enum of possible participant action triggers.
 */
export const ACTION_TRIGGER: { HOVER: ActionTrigger; PERMANENT: ActionTrigger; } = {
    HOVER: 'Hover',
    PERMANENT: 'Permanent'
};

export type MediaState = 'DominantSpeaker' | 'Muted' | 'ForceMuted' | 'Unmuted' | 'None';

/**
 * Enum of possible participant media states.
 */
export const MEDIA_STATE: { [key: string]: MediaState; } = {
    DOMINANT_SPEAKER: 'DominantSpeaker',
    MUTED: 'Muted',
    FORCE_MUTED: 'ForceMuted',
    UNMUTED: 'Unmuted',
    NONE: 'None'
};

export type QuickActionButtonType
    = 'Mute' | 'AskToUnmute' | 'AllowVideo' | 'StopVideo' | 'AllowDesktop' | 'StopDesktop' | 'None';

/**
 * Enum of possible participant mute button states.
 */
export const QUICK_ACTION_BUTTON: {
    ALLOW_DESKTOP: QuickActionButtonType;
    ALLOW_VIDEO: QuickActionButtonType;
    ASK_TO_UNMUTE: QuickActionButtonType;
    MUTE: QuickActionButtonType;
    NONE: QuickActionButtonType;
    STOP_DESKTOP: QuickActionButtonType;
    STOP_VIDEO: QuickActionButtonType;
} = {
    ALLOW_DESKTOP: 'AllowDesktop',
    ALLOW_VIDEO: 'AllowVideo',
    MUTE: 'Mute',
    ASK_TO_UNMUTE: 'AskToUnmute',
    NONE: 'None',
    STOP_DESKTOP: 'StopDesktop',
    STOP_VIDEO: 'StopVideo'
};

export interface IStateIconData {
    className?: string;
    color?: string;
    id?: string;
    labelKey?: string;
    src: Function;
}

/**
 * Data mapping for possible participant audio states.
 */
export const AudioStateIcons: { [key: string]: IStateIconData | null; } = {
    [MEDIA_STATE.DOMINANT_SPEAKER]: {
        className: 'jitsi-icon-dominant-speaker',
        labelKey: 'participantsPane.indicators.audioDominantSpeaker',
        src: IconMic
    },
    [MEDIA_STATE.FORCE_MUTED]: {
        color: '#E04757',
        id: 'audioMuted',
        labelKey: 'participantsPane.indicators.audioForceMuted',
        src: IconMicSlash
    },
    [MEDIA_STATE.MUTED]: {
        id: 'audioMuted',
        labelKey: 'participantsPane.indicators.audioMuted',
        src: IconMicSlash
    },
    [MEDIA_STATE.UNMUTED]: {
        src: IconMic
    },
    [MEDIA_STATE.NONE]: null
};

/**
 * Data mapping for possible participant video states.
 */
export const VideoStateIcons: { [key: string]: IStateIconData | null; } = {
    [MEDIA_STATE.DOMINANT_SPEAKER]: null,
    [MEDIA_STATE.FORCE_MUTED]: {
        color: '#E04757',
        id: 'videoMuted',
        labelKey: 'participantsPane.indicators.videoForceMuted',
        src: IconVideoOff
    },
    [MEDIA_STATE.MUTED]: {
        id: 'videoMuted',
        labelKey: 'participantsPane.indicators.videoMuted',
        src: IconVideoOff
    },
    [MEDIA_STATE.UNMUTED]: {
        src: IconVideo
    },
    [MEDIA_STATE.NONE]: null
};

/**
 * Mobile web context menu avatar size.
 */
export const AVATAR_SIZE = 20;
