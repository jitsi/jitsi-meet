import { IStore } from '../app/types';

/**
 * Action used to start the conference.
 *
 * @param {Object} options - The config options that override the default ones (if any).
 * @param {boolean} _ignoreJoiningInProgress - If true we won't check the joiningInProgress flag.
 * @returns {Function}
 */
export function joinConference(options?: Object, _ignoreJoiningInProgress = false) {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return async function(_dispatch: IStore['dispatch'], _getState: IStore['getState']) {
    };
}
