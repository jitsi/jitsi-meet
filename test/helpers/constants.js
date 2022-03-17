/* eslint-disable no-undef */

export const BASE_URL = process.env.BASE_URL || 'https://alpha.jitsi.net';

export const MODERATOR_BROWSER = process.env.PARTICIPANT1_BROWSER || 'chrome';
export const PARTICIPANT1_BROWSER = process.env.PARTICIPANT1_BROWSER || 'chrome';
export const PARTICIPANT2_BROWSER = process.env.PARTICIPANT2_BROWSER || 'chrome';

export const DEFAULT_CONFIG
= 'config.requireDisplayName=false'
+ '&config.debug=true'
+ '&config.testing.testMode=true'
+ '&config.disableAEC=true'
+ '&config.disableNS=true'
+ '&config.enableTalkWhileMuted=false'
+ '&config.callStatsID=false'
+ '&config.alwaysVisibleToolbar=true'
+ '&config.p2p.enabled=false'
+ '&config.p2p.useStunTurn=false'
+ '&config.pcStatsInterval=1500'
+ '&config.prejoinConfig.enabled=false'
+ '&config.gatherStats=true'
+ '&config.disable1On1Mode=true'
+ '&config.analytics.disabled=true'
+ '&interfaceConfig.SHOW_CHROME_EXTENSION_BANNER=false'
+ '&interfaceConfig.DISABLE_FOCUS_INDICATOR=true';

export const MODERATOR = 'Moderator';
export const FIRST_PARTICIPANT = 'First participant';
export const SECOND_PARTICIPANT = 'Second participant';

export const ENTER_KEY = '\uE007';

export const CHROME_PROPERTIES = {
    maxInstances: 4,
    browserName: 'chrome',
    acceptInsecureCerts: true,
    'goog:chromeOptions': {
        args: [
            'use-fake-device-for-media-stream',
            'use-fake-ui-for-media-stream',
            'disable-plugins',
            'mute-audio',
            'disable-infobars',
            'autoplay-policy=no-user-gesture-required',
            'auto-select-desktop-capture-source=Your Entire screen'
        ]
    }
};

export const FIREFOX_PROPERTIES = {
    maxInstances: 4,
    browserName: 'firefox',
    acceptInsecureCerts: true,
    'moz:firefoxOptions': {
        'prefs': {
            'media.navigator.streams.fake': true,
            'media.navigator.permission.disabled': true,
            'media.peerconnection.ice.tcp': true,
            'intl.accept_languages': 'en',
            'media.autoplay.default': 0
        }
    }
};
