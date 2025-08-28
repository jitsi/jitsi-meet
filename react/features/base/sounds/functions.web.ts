import { IStore } from '../../app/types';

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
 * Set new audio output device on the global sound elements.
 *
 * @param {string } deviceId - The new output deviceId.
 * @returns {Function}
 */
export function setNewAudioOutputDevice(deviceId: string) {
    return function(_dispatch: IStore['dispatch'], getState: IStore['getState']) {
        const sounds = getState()['features/base/sounds'];

        for (const [ , sound ] of sounds) {
            sound.audioElement?.setSinkId?.(deviceId);
        }
    };
}
