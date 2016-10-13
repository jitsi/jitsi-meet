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
    SHOW_BRAND_WATERMARK: false,
    BRAND_WATERMARK_LINK: "",
    SHOW_POWERED_BY: false,
    GENERATE_ROOMNAMES_ON_WELCOME_PAGE: true,
    APP_NAME: "Jitsi Meet",
    INVITATION_POWERED_BY: true,
    // the toolbar buttons line is intentionally left in one line, to be able
    // to easily override values or remove them using regex
    MAIN_TOOLBAR_BUTTONS: ['microphone', 'camera', 'desktop', 'invite', 'fullscreen', 'hangup'], // jshint ignore:line
    TOOLBAR_BUTTONS: ['profile', 'authentication', 'microphone', 'camera', 'desktop', 'recording', 'security', 'raisehand', 'chat', 'etherpad', 'sharedvideo', 'sip', 'dialpad', 'settings', 'hangup', 'filmstrip', 'contacts'], // jshint ignore:line
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
    RANDOM_AVATAR_URL_PREFIX: false,
    RANDOM_AVATAR_URL_SUFFIX: false,
    FILM_STRIP_MAX_HEIGHT: 120,
    LOCAL_THUMBNAIL_RATIO_WIDTH: 16,
    LOCAL_THUMBNAIL_RATIO_HEIGHT: 9,
    REMOTE_THUMBNAIL_RATIO_WIDTH: 1,
    REMOTE_THUMBNAIL_RATIO_HEIGHT: 1,
    // Enables feedback star animation.
    ENABLE_FEEDBACK_ANIMATION: false,
    DISABLE_FOCUS_INDICATOR: false,
    DISABLE_DOMINANT_SPEAKER_INDICATOR: false,
    // disables the ringing sound when the RingOverlay is shown.
    DISABLE_RINGING: false,
    AUDIO_LEVEL_PRIMARY_COLOR: "rgba(255,255,255,0.7)",
    AUDIO_LEVEL_SECONDARY_COLOR: "rgba(255,255,255,0.4)"
};
