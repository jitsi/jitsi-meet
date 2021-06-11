// @flow

/**
 * Reducer key for the feature.
 */
export const REDUCER_KEY = 'features/participants-pane';

export type ActionTrigger = 'Hover' | 'Permanent'

/**
 * Enum of possible participant action triggers.
 */
export const ACTION_TRIGGER: {HOVER: ActionTrigger, PERMANENT: ActionTrigger} = {
    HOVER: 'Hover',
    PERMANENT: 'Permanent'
};

export type MediaState = 'Muted' | 'ForceMuted' | 'Unmuted' | 'None';

/**
 * Enum of possible participant media states.
 */
export const MEDIA_STATE: {
    MUTED: MediaState,
    FORCE_MUTED: MediaState,
    UNMUTED: MediaState,
    NONE: MediaState,
} = {
    MUTED: 'Muted',
    FORCE_MUTED: 'ForceMuted',
    UNMUTED: 'Unmuted',
    NONE: 'None'
};

export type QuickActionButtonType = 'Mute' | 'AskToUnmute' | 'None';

/**
 * Enum of possible participant mute button states.
 */
export const QUICK_ACTION_BUTTON: {
    MUTE: QuickActionButtonType,
    ASK_TO_UNMUTE: QuickActionButtonType,
    NONE: QuickActionButtonType
} = {
    MUTE: 'Mute',
    ASK_TO_UNMUTE: 'AskToUnmute',
    NONE: 'None'
};
