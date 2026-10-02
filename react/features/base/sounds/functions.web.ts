import { IStore } from '../../app/types';

import { setAudioOutputDevice } from './SoundManager';

/**
 * Returns the location of the sounds. On Web it's the relative path to
 * the sounds folder placed in the source root.
 *
 * @returns {string}
 */
export function getSoundsPath() {
    return 'sounds';
}

/**
 * Set new audio output device on the sound manager.
 *
 * @param {string } deviceId - The new output deviceId.
 * @returns {Function}
 */
export function setNewAudioOutputDevice(deviceId: string) {
    return function(_dispatch: IStore['dispatch'], _getState: IStore['getState']) {
        // Delegate to SoundManager which handles the HTMLAudio pool
        setAudioOutputDevice(deviceId);
    };
}
