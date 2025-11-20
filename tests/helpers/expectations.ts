import fs from 'fs';
import { merge } from 'lodash-es';

import { config } from './TestsConfig';

const defaultExpectations = {
    dialIn: {
        /*
         * The dial-in functionality is enabled.
         * true -> assert the config is enabled, the UI elements are displayed, and the feature works.
         * false -> assert the config is disabled and the UI elements are not displayed.
         * null -> if the config is enabled, assert the UI elements are displayed and the feature works.
         */
        enabled: null,
    },
    jaas: {
        /**
         * Whether the jaas account is configured with the account-level setting to allow unauthenticated users to join.
         */
        unauthenticatedJoins: false
    },
    moderation: {
        // Everyone is a moderator.
        allModerators: false,
        // When a moderator leaves, another one is elected.
        autoModerator: true,
        // The first to join is a moderator.
        firstModerator: true,
        // The grantOwner function is available.
        grantModerator: true,
        // Whether the ability to set a password is available (there's a backend options which makes moderators unable
        // to set a room password unless they also happen to have a token (any valid token?))
        setPasswordAvailable: true
    },
    // We can create conferences under any tenant.
    useTenant: true
};

let overrides: any = {};

if (config.expectationsFile) {
    try {
        const str = fs.readFileSync(config.expectationsFile, 'utf8');

        // Remove comments and multiline comments.
        overrides = JSON.parse(str.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, ''));
    } catch (e) {
        console.error('Error reading expectations file', e);
    }
    console.log('Loaded expectations from', config.expectationsFile);
}

export const expectations = merge(defaultExpectations, overrides);

if (!process.env.WDIO_WORKER_ID) {
    console.log('Expectations:', expectations);
}
