import { remote } from 'webdriverio'
export default function createFirefoxSession() {
    return remote({
        capabilities: {
            browserName: 'firefox',
            acceptInsecureCerts: true,
            "moz:firefoxOptions": {
                "prefs": {
                    "media.navigator.streams.fake": true,
                    "media.navigator.permission.disabled": true,
                    "media.peerconnection.ice.tcp": true,
                    "intl.accept_languages": "en",
                    "media.autoplay.default": 0
                }
            }
        }
    })
};
