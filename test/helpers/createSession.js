import { remote } from 'webdriverio';

/**
 * Function that creates a session.
 *
 * @returns {void}
 */
export default function createSession(participantBrowser) {

    switch (participantBrowser) {
    case 'chrome':
        return remote({
            capabilities: {
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
            }
        });
    case 'firefox':
        return remote({
            capabilities: {
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
            }
        });
    default:
        return;
    }
}
