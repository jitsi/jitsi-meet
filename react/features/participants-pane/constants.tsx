import React from 'react';

import Icon from '../base/icons/components/Icon';
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

export type QuickActionButtonType = 'Mute' | 'AskToUnmute' | 'AllowVideo' | 'StopVideo' | 'None';

/**
 * Enum of possible participant mute button states.
 */
export const QUICK_ACTION_BUTTON: {
    ALLOW_VIDEO: QuickActionButtonType;
    ASK_TO_UNMUTE: QuickActionButtonType;
    MUTE: QuickActionButtonType;
    NONE: QuickActionButtonType;
    STOP_VIDEO: QuickActionButtonType;
} = {
    ALLOW_VIDEO: 'AllowVideo',
    MUTE: 'Mute',
    ASK_TO_UNMUTE: 'AskToUnmute',
    NONE: 'None',
    STOP_VIDEO: 'StopVideo'
};

/**
 * Icon mapping for possible participant audio states.
 */
export const AudioStateIcons = {
    [MEDIA_STATE.DOMINANT_SPEAKER]: (
        <Icon
            className = 'jitsi-icon-dominant-speaker'
            size = { 16 }
            src = { IconMic } />
    ),
    [MEDIA_STATE.FORCE_MUTED]: (
        <Icon
            color = '#E04757'
            id = 'audioMuted'
            size = { 16 }
            src = { IconMicSlash } />
    ),
    [MEDIA_STATE.MUTED]: (
        <Icon
            id = 'audioMuted'
            size = { 16 }
            src = { IconMicSlash } />
    ),
    [MEDIA_STATE.UNMUTED]: (
        <Icon
            size = { 16 }
            src = { IconMic } />
    ),
    [MEDIA_STATE.NONE]: null
};

/**
 * Icon mapping for possible participant video states.
 */
export const VideoStateIcons = {
    [MEDIA_STATE.DOMINANT_SPEAKER]: null,
    [MEDIA_STATE.FORCE_MUTED]: (
        <Icon
            color = '#E04757'
            id = 'videoMuted'
            size = { 16 }
            src = { IconVideoOff } />
    ),
    [MEDIA_STATE.MUTED]: (
        <Icon
            id = 'videoMuted'
            size = { 16 }
            src = { IconVideoOff } />
    ),
    [MEDIA_STATE.UNMUTED]: (
        <Icon
            size = { 16 }
            src = { IconVideo } />
    ),
    [MEDIA_STATE.NONE]: null
};

/**
 * Mobile web context menu avatar size.
 */
export const AVATAR_SIZE = 20;
