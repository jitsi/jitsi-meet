import React from 'react';
import { View, ViewStyle } from 'react-native';

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

// fishmeet: icon state style for circular icon containers
const iconState: ViewStyle = {
    backgroundColor: '#C8D7EC', // customizedUiMainColor02
    height: 37,
    width: 37,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
};

/**
 * Icon mapping for possible participant audio states (fishmeet).
 */
export const AudioStateIcons = {
    [MEDIA_STATE.DOMINANT_SPEAKER]: (
        <View style = { iconState }>
            <Icon
                className = 'jitsi-icon-dominant-speaker'
                color = 'transparent'
                size = { 16 }
                src = { IconMic } />
        </View>
    ),
    [MEDIA_STATE.FORCE_MUTED]: (
        <View style = { iconState }>
            <Icon
                color = 'transparent'
                size = { 16 }
                src = { IconMicSlash } />
        </View>
    ),
    [MEDIA_STATE.MUTED]: (
        <View style = { iconState }>
            <Icon
                color = 'transparent'
                size = { 16 }
                src = { IconMicSlash } />
        </View>
    ),
    [MEDIA_STATE.UNMUTED]: (
        <View style = { iconState }>
            <Icon
                color = 'transparent'
                size = { 16 }
                src = { IconMic } />
        </View>
    ),
    [MEDIA_STATE.NONE]: null
};

/**
 * Icon mapping for possible participant video states (fishmeet).
 */
export const VideoStateIcons = {
    [MEDIA_STATE.DOMINANT_SPEAKER]: null,
    [MEDIA_STATE.FORCE_MUTED]: (
        <View style = { iconState }>
            <Icon
                color = 'transparent'
                id = 'videoMuted'
                size = { 16 }
                src = { IconVideoOff } />
        </View>
    ),
    [MEDIA_STATE.MUTED]: (
        <View style = { iconState }>
            <Icon
                color = 'transparent'
                id = 'videoMuted'
                size = { 16 }
                src = { IconVideoOff } />
        </View>
    ),
    [MEDIA_STATE.UNMUTED]: (
        <View style = { iconState }>
            <Icon
                color = 'transparent'
                size = { 16 }
                src = { IconVideo } />
        </View>
    ),
    [MEDIA_STATE.NONE]: null
};

/**
 * Mobile web context menu avatar size.
 */
export const AVATAR_SIZE = 20;
