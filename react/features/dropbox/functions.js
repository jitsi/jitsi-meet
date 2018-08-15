// @flow

import { Dropbox } from 'dropbox';

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * Fetches information about the user's dropbox account.
 *
 * @param {string} token - The dropbox access token.
 * @param {string} clientId - The Jitsi Recorder dropbox app ID.
 * @returns {Promise<Object|undefined>}
 */
export function getDropboxData(
        token: string,
        clientId: string
): Promise<?Object> {
    const dropboxAPI = new Dropbox({
        accessToken: token,
        clientId
    });

    return Promise.all(
        [ dropboxAPI.usersGetCurrentAccount(), dropboxAPI.usersGetSpaceUsage() ]
    ).then(([ account, space ]) => {
        const { allocation, used } = space;
        const { allocated } = allocation;

        return {
            userName: account.name.display_name,
            spaceLeft: Math.floor((allocated - used) / 1048576)// 1MiB=1048576B
        };

    }, error => {
        logger.error(error);

        return undefined;
    });
}
