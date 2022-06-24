/**
 * Thresholds for displaying toolbox buttons.
 */
export const THRESHOLDS = [
    {
        width: 520,
        order: [ 'microphone', 'camera', 'desktop', 'chat', 'raisehand', 'participants', 'tileview', 'selfie' ]
    },
    {
        width: 470,
        order: [ 'microphone', 'camera', 'desktop', 'chat', 'raisehand', 'participants', 'selfie' ]
    },
    {
        width: 420,
        order: [ 'microphone', 'camera', 'desktop', 'chat', 'participants', 'selfie' ]
    },
    {
        width: 370,
        order: [ 'microphone', 'camera', 'chat', 'participants', 'selfie' ]
    },
    {
        width: 225,
        order: [ 'microphone', 'camera', 'chat', 'selfie' ]
    },
    {
        width: 200,
        order: [ 'microphone', 'camera', 'selfie' ]
    }
];

export const NOT_APPLICABLE = 'N/A';

export const TOOLBAR_TIMEOUT = 4000;

export const DRAWER_MAX_HEIGHT = '80vh - 64px';

export const NOTIFY_CLICK_MODE = {
    ONLY_NOTIFY: 'ONLY_NOTIFY',
    PREVENT_AND_NOTIFY: 'PREVENT_AND_NOTIFY'
};
