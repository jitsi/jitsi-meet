/* global config */

// Exercise UI and signaling without claiming media transmission coverage.
config.disableInitialGUM = true;
config.startWithAudioMuted = true;
config.startWithVideoMuted = true;
config.showPollSingleAnswerSetting = true;

// Browser commands can take longer than the default toolbar hide timeout.
config.toolbarConfig = {
    ...config.toolbarConfig,
    alwaysVisible: true
};
