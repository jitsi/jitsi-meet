export * from './functions';

import { getDisplayName, getSpaceUsage } from './functions';
import logger from './logger';

/**
 * Information related to the user's dropbox account.
 */
type DropboxUserData = {

    /**
     * The available space left in MB into the user's Dropbox account.
     */
    spaceLeft: number;

    /**
     * The display name of the user in Dropbox.
     */
    userName: string;
};

/**
 * Fetches information about the user's dropbox account.
 *
 * @param {string} token - The dropbox access token.
 * @param {string} appKey - The Jitsi Recorder dropbox app key.
 * @returns {Promise<DropboxUserData|undefined>}
 */
export function getDropboxData(
        token: string,
        appKey: string
): Promise<DropboxUserData | undefined> {
    return Promise.all(
        [ getDisplayName(token, appKey), getSpaceUsage(token, appKey) ]
    ).then(([ userName, space ]) => {
        const { allocated, used } = space;

        return {
            userName,
            spaceLeft: Math.floor((allocated - used) / 1048576)// 1MiB=1048576B
        };

    }, error => {
        logger.error(error);

        return undefined;
    });
}
