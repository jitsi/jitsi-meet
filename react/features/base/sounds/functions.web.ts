import { IReduxState } from '../../app/types';
import { MUTE_SOUNDS_COMMAND } from '../../reactions/constants';
import { getConferenceState } from '../conference/functions';

import SoundService from './components/SoundService';

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
 * @returns {Function}
 */
export function setNewAudioOutputDevice() {
    return SoundService.setAudioOutputDevice();
}


export function setMuteSoundGlobal(soundId: string, isMuted: boolean = false, updateBackend: boolean = true, state: IReduxState) {
    if (updateBackend) {
        const { conference } = getConferenceState(state);

        // Send a command to all other participants with the soundId and the mute status.
        conference?.sendCommand(MUTE_SOUNDS_COMMAND, {
            attributes: {
                soundId,
                isMuted
            }
        });
    }
}
