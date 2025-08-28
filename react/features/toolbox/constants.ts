import { NativeToolbarButton, ToolbarButton } from './types';

/**
 * Dummy toolbar threschold value for 9 buttons. It is used as a placeholder in THRESHOLDS that would work only when
 * this value is overiden.
 */
export const DUMMY_9_BUTTONS_THRESHOLD_VALUE = Symbol('9_BUTTONS_THRESHOLD_VALUE');

/**
 * Dummy toolbar threschold value for 10 buttons. It is used as a placeholder in THRESHOLDS that would work only when
 * this value is overiden.
 */
export const DUMMY_10_BUTTONS_THRESHOLD_VALUE = Symbol('10_BUTTONS_THRESHOLD_VALUE');

/**
 * Thresholds for displaying toolbox buttons.
 */
export const THRESHOLDS = [

    // This entry won't be used unless the order is overridden trough the mainToolbarButtons config prop.
    {
        width: 675,
        order: DUMMY_10_BUTTONS_THRESHOLD_VALUE
    },

    // This entry won't be used unless the order is overridden trough the mainToolbarButtons config prop.
    {
        width: 625,
        order: DUMMY_9_BUTTONS_THRESHOLD_VALUE
    },
    {
        width: 565,
        order: [ 'microphone', 'camera', 'desktop', 'chat', 'raisehand', 'reactions', 'participants-pane', 'tileview' ]
    },
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
 * Thresholds for displaying native toolbox buttons.
 */
export const NATIVE_THRESHOLDS = [
    {
        width: 560,
        order: [ 'microphone', 'camera', 'chat', 'desktop', 'raisehand', 'tileview', 'overflowmenu', 'hangup' ]
    },
    {
        width: 500,
        order: [ 'microphone', 'camera', 'chat', 'raisehand', 'tileview', 'overflowmenu', 'hangup' ]
    },
    {
        width: 440,
        order: [ 'microphone', 'camera', 'chat', 'raisehand', 'overflowmenu', 'hangup' ]
    },
    {
        width: 380,
        order: [ 'microphone', 'camera', 'chat', 'overflowmenu', 'hangup' ]
    },
    {
        width: 320,
        order: [ 'microphone', 'camera', 'overflowmenu', 'hangup' ]
    }
];

/**
 * Main toolbar buttons priority used to determine which button should be picked to fill empty spaces for disabled
 * buttons.
 */
export const MAIN_TOOLBAR_BUTTONS_PRIORITY = [
    'microphone',
    'camera',
    'desktop',
    'chat',
    'raisehand',
    'reactions',
    'participants-pane',
    'tileview',
    'overflowmenu',
    'hangup',
    'invite',
    'toggle-camera',
    'videoquality',
    'fullscreen',
    'security',
    'closedcaptions',
    'recording',
    'livestreaming',
    'linktosalesforce',
    'sharedvideo',
    'shareaudio',
    'noisesuppression',
    'whiteboard',
    'etherpad',
    'select-background',
    'stats',
    'settings',
    'shortcuts',
    'profile',
    'embedmeeting',
    'feedback',
    'download',
    'help'
];

export const TOOLBAR_TIMEOUT = 4000;

export const DRAWER_MAX_HEIGHT = '80dvh - 64px';

// Around 300 to be displayed above components like chat
export const ZINDEX_DIALOG_PORTAL = 302;

/**
 * Color for spinner displayed in the toolbar.
 */
export const SPINNER_COLOR = '#929292';

/**
 * The list of all possible UI buttons.
 *
 * @protected
 * @type Array<string>
 */
export const TOOLBAR_BUTTONS: ToolbarButton[] = [
    'camera',
    'chat',
    'closedcaptions',
    'desktop',
    'download',
    'embedmeeting',
    'etherpad',
    'feedback',
    'filmstrip',
    'fullscreen',
    'hangup',
    'help',
    'highlight',
    'invite',
    'linktosalesforce',
    'livestreaming',
    'microphone',
    'mute-everyone',
    'mute-video-everyone',
    'participants-pane',
    'profile',
    'raisehand',
    'recording',
    'security',
    'select-background',
    'settings',
    'shareaudio',
    'noisesuppression',
    'sharedvideo',
    'shortcuts',
    'stats',
    'tileview',
    'toggle-camera',
    'videoquality',
    'whiteboard'
];

/**
 * The list of all possible native buttons.
 *
 * @protected
 * @type Array<string>
 */
export const NATIVE_TOOLBAR_BUTTONS: NativeToolbarButton[] = [
    'camera',
    'chat',
    'hangup',
    'microphone',
    'overflowmenu',
    'raisehand',
    'desktop',
    'tileview'
];

/**
 * The toolbar buttons to show when in visitors mode.
 */
export const VISITORS_MODE_BUTTONS: ToolbarButton[] = [
    'chat',
    'closedcaptions',
    'fullscreen',
    'hangup',
    'participants-pane',
    'raisehand',
    'settings',
    'stats',
    'tileview',
    'videoquality'
];
