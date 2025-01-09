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

const ffExcludes = [
    'specs/2way/iFrameParticipantsPresence.spec.ts', // FF does not support uploading files (uploadFile)

    // FF does not support setting a file as mic input, no dominant speaker events
    'specs/3way/activeSpeaker.spec.ts',
    'specs/4way/desktopSharing.spec.ts'
];

const mergedConfig = merge(defaultConfig, {
    ffExcludes,
    capabilities: {
        participant1: {
            capabilities: {
                browserName: 'firefox',
                'moz:firefoxOptions': {
                    args: ffArgs,
                    prefs: ffPreferences
                },
                acceptInsecureCerts: process.env.ALLOW_INSECURE_CERTS === 'true'
            }
        },
        participant2: {
            capabilities: {
                'wdio:exclude': [
                    ...defaultConfig.capabilities.participant2.capabilities['wdio:exclude'],
                    ...ffExcludes
                ]
            }
        },
        participant3: {
            capabilities: {
                'wdio:exclude': [
                    ...defaultConfig.capabilities.participant3.capabilities['wdio:exclude'],
                    ...ffExcludes
                ]
            }
        },
        participant4: {
            capabilities: {
                'wdio:exclude': [
                    ...defaultConfig.capabilities.participant4.capabilities['wdio:exclude'],
                    ...ffExcludes
                ]
            }
        }
    }
}, { clone: false });

// Remove the chrome options from the first participant
// @ts-ignore
mergedConfig.capabilities.participant1.capabilities['goog:chromeOptions'] = undefined;

export const config = mergedConfig;
