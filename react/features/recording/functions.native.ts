import { IStore } from '../app/types';

export * from './functions.any';

/**
 * Checks if the video mute operation needs to be stopped.
 *
 * @param {boolean} _muted - The new mute state.
 * @param {Function} _dispatch - The redux dispatch function.
 * @returns {boolean} - False always.
 */
export function maybeStopMuteBecauseOfLocalRecording(_muted: boolean, _dispatch: IStore['dispatch']) {
    return false;
}
