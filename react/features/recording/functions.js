// @flow

import { Dropbox } from 'dropbox';

import { JitsiRecordingConstants } from '../base/lib-jitsi-meet';

/**
 * Searches in the passed in redux state for an active recording session of the
 * passed in mode.
 *
 * @param {Object} state - The redux state to search in.
 * @param {string} mode - Find an active recording session of the given mode.
 * @returns {Object|undefined}
 */
export function getActiveSession(state: Object, mode: string) {
    const { sessionDatas } = state['features/recording'];
    const { status: statusConstants } = JitsiRecordingConstants;

    return sessionDatas.find(sessionData => sessionData.mode === mode
        && (sessionData.status === statusConstants.ON
            || sessionData.status === statusConstants.PENDING));
}

/**
 * Searches in the passed in redux state for a recording session that matches
 * the passed in recording session ID.
 *
 * @param {Object} state - The redux state to search in.
 * @param {string} id - The ID of the recording session to find.
 * @returns {Object|undefined}
 */
export function getSessionById(state: Object, id: string) {
    return state['features/recording'].sessionDatas.find(
        sessionData => sessionData.id === id);
}

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

    }, () => undefined);
}
