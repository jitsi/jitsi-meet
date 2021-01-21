// @flow

/**
 * The height of the filmstrip in narrow aspect ratio, or width in wide.
 */
export const FILMSTRIP_SIZE = 90;

/**
 * The aspect ratio of a tile in tile view.
 */
export const TILE_ASPECT_RATIO = 16 / 9;


/**
 * Map of attributes of the video element to the corresponding video event that we are going to process.
 * Will be adding a listener for every event in the list. The latest event will be stored in redux. This is
 * currently used by torture only.
 */
export const VIDEO_TEST_EVENTS = {
    'onAbort': 'abort',
    'onCanPlay': 'canplay',
    'onCanPlayThrough': 'canplaytrough',
    'onEmptied': 'emptied',
    'onEnded': 'ended',
    'onError': 'error',
    'onLoadedData': 'loadeddata',
    'onLoadedMetadata': 'loadedmetadata',
    'onLoadStart': 'loadstart',
    'onPause': 'pause',
    'onPlay': 'play',
    'onPlaying': 'playing',
    'onRateChange': 'ratechange',
    'onStalled': 'stalled',
    'onSuspend': 'suspend',
    'onWaiting': 'waiting'
};


/**
 * Display mode constant used when video is being displayed on the small video.
 * @type {number}
 * @constant
 */
export const DISPLAY_VIDEO = 0;

/**
 * Display mode constant used when the user's avatar is being displayed on
 * the small video.
 * @type {number}
 * @constant
 */
export const DISPLAY_AVATAR = 1;

/**
 * Display mode constant used when neither video nor avatar is being displayed
 * on the small video. And we just show the display name.
 * @type {number}
 * @constant
 */
export const DISPLAY_BLACKNESS_WITH_NAME = 2;

/**
 * Display mode constant used when video is displayed and display name
 * at the same time.
 * @type {number}
 * @constant
 */
export const DISPLAY_VIDEO_WITH_NAME = 3;

/**
 * Display mode constant used when neither video nor avatar is being displayed
 * on the small video. And we just show the display name.
 * @type {number}
 * @constant
 */
export const DISPLAY_AVATAR_WITH_NAME = 4;


export const DISPLAY_MODE_TO_CLASS_NAME = [ 'display-video', 'display-avatar-only', 'display-name-on-black',
    'display-name-on-video', 'display-avatar-with-name' ];

export const DISPLAY_MODE_TO_STRING = [ 'video', 'avatar', 'blackness-with-name',
    'video-with-name', 'avatar-with-name' ];
