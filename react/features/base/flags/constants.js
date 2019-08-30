// @flow

/**
 * Flag indicating if calendar integration should be enabled.
 * Default: enabled (true) on Android, auto-detected on iOS.
 */
export const CALENDAR_ENABLED = 'calendar.enabled';

/**
 * Flag indicating if chat should be enabled.
 * Default: enabled (true).
 */
export const CHAT_ENABLED = 'chat.enabled';

/**
 * Default toolbar buttons to display.
 */
export const DEFAULT_TOOLBAR_BUTTONS = 'audiomute,audioonly,audioroute,closedcaption,hangup,infodialog,invite'
+ 'recording,livestream,overflowmenu,raisehand,roomlock,tileview,togglecamera,videomute';

/**
 * Flag indicating if recording should be enabled in iOS.
 * Default: disabled (false).
 */
export const IOS_RECORDING_ENABLED = 'ios.recording.enabled';

/**
 * Flag indicating if Picture-in-Picture should be enabled.
 * Default: auto-detected.
 */
export const PIP_ENABLED = 'pip.enabled';


/**
 * The name of the toolbar buttons to display. If present,
 * the button will display.
 */
export const TOOLBAR_BUTTONS = 'toolbar.buttons';

/**
 * Flag indicating if the welcome page should be enabled.
 * Default: disabled (false).
 */
export const WELCOME_PAGE_ENABLED = 'welcomepage.enabled';
