/**
 * Thresholds for displaying toolbox buttons.
 */
export const THRESHOLDS = [
    {
        width: 520,
        order: [ 'microphone', 'camera', 'desktop', 'chat', 'raisehand', 'participants-pane', 'tileview' ]
    },
    {
        width: 470,
        order: [ 'microphone', 'camera', 'desktop', 'chat', 'raisehand', 'participants-pane' ]
    },
    {
        width: 420,
        order: [ 'microphone', 'camera', 'desktop', 'chat', 'participants-pane' ]
    },
    {
        width: 370,
        order: [ 'microphone', 'camera', 'chat', 'participants-pane' ]
    },
    {
        width: 225,
        order: [ 'microphone', 'camera', 'chat' ]
    },
    {
        width: 200,
        order: [ 'microphone', 'camera' ]
    }
];

/**
 * Thresholds for displaying toolbox buttons on mobile web browsers.
 */
export const THRESHOLDS_MOBILE_WEB = [
    {
        width: 520,
        order: [ 'microphone', 'camera', 'chat', 'toggle-camera', 'raisehand', 'participants-pane', 'tileview' ]
    },
    {
        width: 470,
        order: [ 'microphone', 'camera', 'chat', 'toggle-camera', 'raisehand', 'participants-pane' ]
    },
    {
        width: 420,
        order: [ 'microphone', 'camera', 'chat', 'toggle-camera', 'participants-pane' ]
    },
    {
        width: 370,
        order: [ 'microphone', 'camera', 'chat', 'toggle-camera' ]
    },
    {
        width: 225,
        order: [ 'microphone', 'camera', 'chat' ]
    },
    {
        width: 200,
        order: [ 'microphone', 'camera' ]
    }
];

export const NOT_APPLICABLE = 'N/A';

export const TOOLBAR_TIMEOUT = 4000;

export const DRAWER_MAX_HEIGHT = '80vh - 64px';

export const NOTIFY_CLICK_MODE = {
    ONLY_NOTIFY: 'ONLY_NOTIFY',
    PREVENT_AND_NOTIFY: 'PREVENT_AND_NOTIFY'
};
