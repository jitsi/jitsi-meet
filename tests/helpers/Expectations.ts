import fs from 'fs';
import { merge } from 'lodash-es';

import { config } from './TestsConfig';

const defaultExpectations = {
    moderation: {
        // Everyone is a moderator.
        allModerators: false,
        // When a moderator leaves, another one is elected.
        autoModerator: true,
        // The first to join is a moderator.
        firstModerator: true
    }
};

let overrides: any = {};

if (config.expectationsFile) {
    try {
        overrides = JSON.parse(fs.readFileSync(config.expectationsFile, 'utf8'));
    } catch (e) {
        console.error('Error reading expectations file', e);
    }
    console.log('Loaded expectations from', config.expectationsFile);
}

export const expectations = merge(defaultExpectations, overrides);

console.log('Expectations:', expectations);
