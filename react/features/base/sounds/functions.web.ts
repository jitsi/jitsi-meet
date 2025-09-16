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
    return function(_dispatch: IStore['dispatch'], _getState: IStore['getState']) {
        // Route through SoundManager to apply sink to managed pool
        import('./SoundManager.web').then(({ default: SoundManager }) => {
            SoundManager.setSinkId(deviceId);
        });
    };
}
