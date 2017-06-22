var interfaceConfig = { // eslint-disable-line no-unused-vars
    CANVAS_EXTRA: 104,
    CANVAS_RADIUS: 0,
    SHADOW_COLOR: '#ffffff',
    // TO FIX: this needs to be handled from SASS variables. There are some
    // methods allowing to use variables both in css and js.
    DEFAULT_BACKGROUND: '#474747',
    INITIAL_TOOLBAR_TIMEOUT: 20000,
    TOOLBAR_TIMEOUT: 4000,
    DEFAULT_REMOTE_DISPLAY_NAME: "Fellow Jitster",
    DEFAULT_LOCAL_DISPLAY_NAME: "me",
    SHOW_JITSI_WATERMARK: true,
    JITSI_WATERMARK_LINK: "https://jitsi.org",
    // if watermark is disabled by default, it can be shown only for guests
    SHOW_WATERMARK_FOR_GUESTS: true,
    SHOW_BRAND_WATERMARK: false,
    BRAND_WATERMARK_LINK: "",
    SHOW_POWERED_BY: false,
    GENERATE_ROOMNAMES_ON_WELCOME_PAGE: true,
    APP_NAME: "Jitsi Meet",
    LANG_DETECTION: false,    // Allow i18n to detect the system language
    INVITATION_POWERED_BY: true,
    /**
     * If we should show authentication block in profile
     */
    AUTHENTICATION_ENABLE: true,
    /**
     * The index of the splitter button in the main toolbar. The splitter
     * button is a button in the toolbar that will be applied a special styling
     * visually dividing the toolbar buttons.
     */
    //MAIN_TOOLBAR_SPLITTER_INDEX: -1,
    /**
     * the toolbar buttons line is intentionally left in one line, to be able
     * to easily override values or remove them using regex
     */
    TOOLBAR_BUTTONS: [
        //main toolbar
        'microphone', 'camera', 'desktop', 'invite', 'fullscreen', 'fodeviceselection', 'hangup', // jshint ignore:line
        //extended toolbar
        'profile', 'add', 'contacts', 'chat', 'recording', 'etherpad', 'sharedvideo', 'dialout', 'settings', 'raisehand', 'filmstrip'], // jshint ignore:line
    /**
     * Main Toolbar Buttons
     * All of them should be in TOOLBAR_BUTTONS
     */
    MAIN_TOOLBAR_BUTTONS: ['microphone', 'camera', 'desktop', 'invite', 'fullscreen', 'fodeviceselection', 'hangup'], // jshint ignore:line
    SETTINGS_SECTIONS: ['language', 'devices', 'moderator'],
    // Determines how the video would fit the screen. 'both' would fit the whole
    // screen, 'height' would fit the original video height to the height of the
    // screen, 'width' would fit the original video width to the width of the
    // screen respecting ratio.
    VIDEO_LAYOUT_FIT: 'both',
    SHOW_CONTACTLIST_AVATARS: false,
    /**
     * Whether to only show the filmstrip (and hide the toolbar).
     */
    filmStripOnly: false,

    /**
     * Whether to show thumbnails in filmstrip as a column instead of as a row.
     */
    VERTICAL_FILMSTRIP: true,

    //A html text to be shown to guests on the close page, false disables it
    CLOSE_PAGE_GUEST_HINT: false,
    RANDOM_AVATAR_URL_PREFIX: false,
    RANDOM_AVATAR_URL_SUFFIX: false,
    FILM_STRIP_MAX_HEIGHT: 120,
    // Enables feedback star animation.
    ENABLE_FEEDBACK_ANIMATION: false,
    DISABLE_FOCUS_INDICATOR: false,
    DISABLE_DOMINANT_SPEAKER_INDICATOR: false,

    /**
     * Whether the ringing sound in the call/ring overlay is disabled. If
     * {@code undefined}, defaults to {@code false}.
     *
     * @type {boolean}
     */
    DISABLE_RINGING: false,
    AUDIO_LEVEL_PRIMARY_COLOR: "rgba(255,255,255,0.4)",
    AUDIO_LEVEL_SECONDARY_COLOR: "rgba(255,255,255,0.2)",
    POLICY_LOGO: null,
    LOCAL_THUMBNAIL_RATIO: 16/9, //16:9
    REMOTE_THUMBNAIL_RATIO: 1, //1:1
    // Documentation reference for the live streaming feature.
    LIVE_STREAMING_HELP_LINK: "https://jitsi.org/live",

    /**
     * Whether the mobile app Jitsi Meet is to be promoted to participants
     * attempting to join a conference in a mobile Web browser. If
     * {@code undefined}, defaults to {@code true}.
     *
     * @type {boolean}
     */
    MOBILE_APP_PROMO: true,

    /**
     * Maximum coeficient of the ratio of the large video to the visible area
     * after the large video is scaled to fit the window.
     *
     * @type {number}
     */
    MAXIMUM_ZOOMING_COEFFICIENT: 1.3

    /*
     * If indicated some of the error dialogs may point to the support URL for
     * help.
     */
    // SUPPORT_URL: ""
};
