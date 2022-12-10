/* eslint-disable no-unused-vars, no-var, max-len */
/* eslint sort-keys: ["error", "asc", {"caseSensitive": false}] */

/**
 * !!!IMPORTANT!!!
 *
 * This file is considered deprecated. All options will eventually be moved to
 * config.js, and no new options should be added here.
 */

var interfaceConfig = {
    APP_NAME: 'Jitsi Meet',
    AUDIO_LEVEL_PRIMARY_COLOR: 'rgba(255,255,255,0.4)',
    AUDIO_LEVEL_SECONDARY_COLOR: 'rgba(255,255,255,0.2)',

    /**
     * A UX mode where the last screen share participant is automatically
     * pinned. Valid values are the string "remote-only" so remote participants
     * get pinned but not local, otherwise any truthy value for all participants,
     * and any falsy value to disable the feature.
     *
     * Note: this mode is experimental and subject to breakage.
     */
    AUTO_PIN_LATEST_SCREEN_SHARE: 'remote-only',
    BRAND_WATERMARK_LINK: '',

    CLOSE_PAGE_GUEST_HINT: false, // A html text to be shown to guests on the close page, false disables it

    DEFAULT_BACKGROUND: '#040404',
    DEFAULT_WELCOME_PAGE_LOGO_URL: 'images/watermark.svg',

    DISABLE_DOMINANT_SPEAKER_INDICATOR: false,

    /**
     * If true, notifications regarding joining/leaving are no longer displayed.
     */
    DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,

    /**
     * If true, presence status: busy, calling, connected etc. is not displayed.
     */
    DISABLE_PRESENCE_STATUS: false,

    /**
     * Whether the ringing sound in the call/ring overlay is disabled. If
     * {@code undefined}, defaults to {@code false}.
     *
     * @type {boolean}
     */
    DISABLE_RINGING: false,

    /**
     * Whether the speech to text transcription subtitles panel is disabled.
     * If {@code undefined}, defaults to {@code false}.
     *
     * @type {boolean}
     */
    DISABLE_TRANSCRIPTION_SUBTITLES: false,

    /**
     * Whether or not the blurred video background for large video should be
     * displayed on browsers that can support it.
     */
    DISABLE_VIDEO_BACKGROUND: false,

    DISPLAY_WELCOME_FOOTER: true,
    DISPLAY_WELCOME_PAGE_ADDITIONAL_CARD: false,
    DISPLAY_WELCOME_PAGE_CONTENT: false,
    DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT: false,

    ENABLE_DIAL_OUT: true,

    ENABLE_FEEDBACK_ANIMATION: false, // Enables feedback star animation.

    FILM_STRIP_MAX_HEIGHT: 120,

    GENERATE_ROOMNAMES_ON_WELCOME_PAGE: true,

    /**
     * Hide the logo on the deep linking pages.
     */
    HIDE_DEEP_LINKING_LOGO: false,

    /**
     * Hide the invite prompt in the header when alone in the meeting.
     */
    HIDE_INVITE_MORE_HEADER: false,

    JITSI_WATERMARK_LINK: 'https://jitsi.org',

    LANG_DETECTION: true, // Allow i18n to detect the system language
    LOCAL_THUMBNAIL_RATIO: 16 / 9, // 16:9

    /**
     * Maximum coefficient of the ratio of the large video to the visible area
     * after the large video is scaled to fit the window.
     *
     * @type {number}
     */
    MAXIMUM_ZOOMING_COEFFICIENT: 1.3,

    /**
     * Whether the mobile app Jitsi Meet is to be promoted to participants
     * attempting to join a conference in a mobile Web browser. If
     * {@code undefined}, defaults to {@code true}.
     *
     * @type {boolean}
     */
    MOBILE_APP_PROMO: true,

    /**
     * Specify custom URL for downloading android mobile app.
     */
    MOBILE_DOWNLOAD_LINK_ANDROID: 'https://play.google.com/store/apps/details?id=org.jitsi.meet',

    /**
     * Specify custom URL for downloading f droid app.
     */
    MOBILE_DOWNLOAD_LINK_F_DROID: 'https://f-droid.org/en/packages/org.jitsi.meet/',

    /**
     * Specify URL for downloading ios mobile app.
     */
    MOBILE_DOWNLOAD_LINK_IOS: 'https://itunes.apple.com/us/app/jitsi-meet/id1165103905',

    NATIVE_APP_NAME: 'Jitsi Meet',

    // Names of browsers which should show a warning stating the current browser
    // has a suboptimal experience. Browsers which are not listed as optimal or
    // unsupported are considered suboptimal. Valid values are:
    // chrome, chromium, edge, electron, firefox, nwjs, opera, safari
    OPTIMAL_BROWSERS: [ 'chrome', 'chromium', 'firefox', 'nwjs', 'electron', 'safari' ],

    POLICY_LOGO: null,
    PROVIDER_NAME: 'Jitsi',

    /**
     * If true, will display recent list
     *
     * @type {boolean}
     */
    RECENT_LIST_ENABLED: true,
    REMOTE_THUMBNAIL_RATIO: 1, // 1:1

    SETTINGS_SECTIONS: [ 'devices', 'language', 'moderator', 'profile', 'calendar', 'sounds', 'more' ],

    /**
     * Specify which sharing features should be displayed. If the value is not set
     * all sharing features will be shown. You can set [] to disable all.
     */
    // SHARING_FEATURES: ['email', 'url', 'dial-in', 'embed'],

    SHOW_BRAND_WATERMARK: false,

    /**
     * Decides whether the chrome extension banner should be rendered on the landing page and during the meeting.
     * If this is set to false, the banner will not be rendered at all. If set to true, the check for extension(s)
     * being already installed is done before rendering.
     */
    SHOW_CHROME_EXTENSION_BANNER: false,

    SHOW_DEEP_LINKING_IMAGE: false,
    SHOW_JITSI_WATERMARK: true,
    SHOW_POWERED_BY: false,
    SHOW_PROMOTIONAL_CLOSE_PAGE: false,

    /*
     * If indicated some of the error dialogs may point to the support URL for
     * help.
     */
    SUPPORT_URL: 'https://community.jitsi.org/',

    // Browsers, in addition to those which do not fully support WebRTC, that
    // are not supported and should show the unsupported browser page.
    UNSUPPORTED_BROWSERS: [],

    /**
     * Whether to show thumbnails in filmstrip as a column instead of as a row.
     */
    VERTICAL_FILMSTRIP: true,

    // Determines how the video would fit the screen. 'both' would fit the whole
    // screen, 'height' would fit the original video height to the height of the
    // screen, 'width' would fit the original video width to the width of the
    // screen respecting ratio, 'nocrop' would make the video as large as
    // possible and preserve aspect ratio without cropping.
    VIDEO_LAYOUT_FIT: 'both',

    /**
     * If true, hides the video quality label indicating the resolution status
     * of the current large video.
     *
     * @type {boolean}
     */
    VIDEO_QUALITY_LABEL_DISABLED: false,

    /**
     * How many columns the tile view can expand to. The respected range is
     * between 1 and 5.
     */
    // TILE_VIEW_MAX_COLUMNS: 5,

    /**
     * Specify Firebase dynamic link properties for the mobile apps.
     */
    // MOBILE_DYNAMIC_LINK: {
    //    APN: 'org.jitsi.meet',
    //    APP_CODE: 'w2atb',
    //    CUSTOM_DOMAIN: undefined,
    //    IBI: 'com.atlassian.JitsiMeet.ios',
    //    ISI: '1165103905'
    // },

    /**
     * Specify mobile app scheme for opening the app from the mobile browser.
     */
    // APP_SCHEME: 'org.jitsi.meet',

    /**
     * Specify the Android app package name.
     */
    // ANDROID_APP_PACKAGE: 'org.jitsi.meet',

    // List of undocumented settings
    /**
     INDICATOR_FONT_SIZES
     PHONE_NUMBER_REGEX
    */

    // -----------------DEPRECATED CONFIGS BELOW THIS LINE-----------------------------

    // Connection indicators (
    // CONNECTION_INDICATOR_AUTO_HIDE_ENABLED,
    // CONNECTION_INDICATOR_AUTO_HIDE_TIMEOUT,
    // CONNECTION_INDICATOR_DISABLED) got moved to config.js.

    // Please use disableModeratorIndicator from config.js
    // DISABLE_FOCUS_INDICATOR: false,

    // Please use defaultLocalDisplayName from config.js
    // DEFAULT_LOCAL_DISPLAY_NAME: 'me',

    // Please use defaultLogoUrl from config.js
    // DEFAULT_LOGO_URL: 'images/watermark.svg',

    // Please use defaultRemoteDisplayName from config.js
    // DEFAULT_REMOTE_DISPLAY_NAME: 'Fellow Jitster',

    // Moved to config.js as `toolbarConfig.initialTimeout`.
    // INITIAL_TOOLBAR_TIMEOUT: 20000,

    // Please use `liveStreaming.helpLink` from config.js
    // Documentation reference for the live streaming feature.
    // LIVE_STREAMING_HELP_LINK: 'https://jitsi.org/live',

    // Moved to config.js as `toolbarConfig.alwaysVisible`.
    // TOOLBAR_ALWAYS_VISIBLE: false,

    // This config was moved to config.js as `toolbarButtons`.
    // TOOLBAR_BUTTONS: [],

    // Moved to config.js as `toolbarConfig.timeout`.
    // TOOLBAR_TIMEOUT: 4000,

    // Allow all above example options to include a trailing comma and
    // prevent fear when commenting out the last value.
    // eslint-disable-next-line sort-keys
    makeJsonParserHappy: 'even if last key had a trailing comma'

    // No configuration value should follow this line.
};

/* eslint-enable no-unused-vars, no-var, max-len */
