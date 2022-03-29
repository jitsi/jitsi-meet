/* eslint-disable no-undef */

// Define base url.
export const BASE_URL = process.env.BASE_URL || 'https://alpha.jitsi.net';

// Define available browsers.
export const FIREFOX_BROWSER = 'firefox';
export const CHROME_BROWSER = 'chrome';

// Define browser for each participant.
export const PARTICIPANT1_BROWSER = process.env.PARTICIPANT1_BROWSER || CHROME_BROWSER;
export const PARTICIPANT2_BROWSER = process.env.PARTICIPANT2_BROWSER || CHROME_BROWSER;
export const PARTICIPANT3_BROWSER = process.env.PARTICIPANT3_BROWSER || CHROME_BROWSER;

// Define default config.
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

// Define participants names.
export const FIRST_PARTICIPANT = 'First participant';
export const SECOND_PARTICIPANT = 'Second participant';
export const THIRD_PARTICIPANT = 'Third participant';

export const ENTER_KEY = '\uE007';

// Define chrome properties.
export const CHROME_PROPERTIES = {
    maxInstances: 4,
    browserName: CHROME_BROWSER,
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

// Define firefox properties.
export const FIREFOX_PROPERTIES = {
    maxInstances: 4,
    browserName: FIREFOX_BROWSER,
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

// Define remote selenium grid url.
export const GRID_URL = process.env.GRID_URL ? new URL(process.env.GRID_URL) : null;

// Define services properties based on grid availability.
export const SERVICES = GRID_URL ? [] : [ 'selenium-standalone' ];

// Define max instances.

export const MAX_INSANCES = process.env.MAX_INSANCES || 1;
