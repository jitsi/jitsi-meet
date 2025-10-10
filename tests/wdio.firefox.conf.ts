// wdio.firefox.conf.ts
// extends the main configuration file changing first participant to be Firefox
import { merge } from 'lodash-es';
import process from 'node:process';

// @ts-ignore
import { config as defaultConfig } from './wdio.conf.ts';

const ffArgs = [];

const ffPreferences = {
    'intl.accept_languages': 'en-US',
    'media.navigator.permission.disabled': true,
    'media.navigator.streams.fake': true,
    'media.autoplay.default': 0
};

if (process.env.HEADLESS === 'true') {
    ffArgs.push('--headless');
}

const mergedConfig = merge(defaultConfig, {
    exclude: [
        'specs/iframe/*.spec.ts', // FF does not support uploading files (uploadFile)

        // FF does not support setting a file as mic input, no dominant speaker events
        'specs/media/activeSpeaker.spec.ts',
        'specs/media/startMuted.spec.ts', // bad audio levels
        'specs/media/desktopSharing.spec.ts',
        'specs/media/lastN.spec.ts',

        // fails randomly for failed downloading asset and page stays in incomplete state
        'specs/misc/urlNormalisation.spec.ts',

        // when unmuting a participant, we see the presence in debug logs immediately,
        // but for 15 seconds it is not received/processed by the client
        // (also the menu disappears after clicking one of the moderation options, does not happen manually)
        'specs/media/audioVideoModeration.spec.ts'
    ],
    capabilities: {
        p1: {
            capabilities: {
                browserName: 'firefox',
                browserVersion: process.env.BROWSER_FF_BETA ? 'beta' : undefined,
                'moz:firefoxOptions': {
                    args: ffArgs,
                    prefs: ffPreferences
                },
                acceptInsecureCerts: process.env.ALLOW_INSECURE_CERTS === 'true'
            }
        }
    }
}, { clone: false });

// Remove the chrome options from the first participant
// @ts-ignore
mergedConfig.capabilities.p1.capabilities['goog:chromeOptions'] = undefined;

export const config = mergedConfig;
