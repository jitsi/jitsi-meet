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

export const DEFAULT_REDUCED_UI_MAIN_TOOLBAR_BUTTONS = [ 'microphone', 'camera' ];

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
 * Thresholds for displaying native toolbox buttons on iOS devices.
 * Breakpoints match real iPhone screen widths (points):
 *   500 - above all iPhones (8+ buttons)
 *   428 - iPhone Pro Max
 *   390 - iPhone 14/15
 *   375 - iPhone SE / 8
 *   320 - fallback
 */
export const IOS_THRESHOLDS = [
    {
        width: 500,
        order: [ 'microphone', 'camera', 'chat', 'screensharing', 'raisehand', 'tileview', 'overflowmenu', 'hangup' ]
    },
    {
        width: 428,
        order: [ 'microphone', 'camera', 'chat', 'raisehand', 'tileview', 'overflowmenu', 'hangup' ]
    },
    {
        width: 375,
        order: [ 'microphone', 'camera', 'chat', 'raisehand', 'overflowmenu', 'hangup' ]
    },
    {
        width: 320,
        order: [ 'microphone', 'camera', 'chat', 'overflowmenu', 'hangup' ]
    }
];

/**
 * Thresholds for displaying native toolbox buttons on Android devices.
 * Breakpoints match common Android screen widths (dp):
 *   500 - large tablets / foldables unfolded
 *   412 - Pixel / Samsung flagship (e.g. Pixel 7, Galaxy S24+)
 *   393 - Samsung Galaxy S24
 *   360 - mid-range Android (e.g. Samsung A-series)
 *   320 - fallback
 */
export const ANDROID_THRESHOLDS = [
    {
        width: 500,
        order: [ 'microphone', 'camera', 'chat', 'screensharing', 'raisehand', 'tileview', 'overflowmenu', 'hangup' ]
    },
    {
        width: 412,
        order: [ 'microphone', 'camera', 'chat', 'raisehand', 'tileview', 'overflowmenu', 'hangup' ]
    },
    {
        width: 360,
        order: [ 'microphone', 'camera', 'chat', 'raisehand', 'overflowmenu', 'hangup' ]
    },
    {
        width: 320,
        order: [ 'microphone', 'camera', 'chat', 'overflowmenu', 'hangup' ]
    }
];

/**
 * Default native thresholds (iOS). Used as initial Redux state before
 * middleware overrides with platform-specific thresholds.
 */
export const NATIVE_THRESHOLDS = IOS_THRESHOLDS;

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
    'help',
    'custom-panel'
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
    'custom-panel',
    'desktop',
    'download',
    'embedmeeting',
    'etherpad',
    'feedback',
    'filesharing',
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
    'polls',
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
