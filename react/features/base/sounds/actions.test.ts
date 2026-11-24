import { describe, expect, it, vi } from 'vitest';

import { IReduxState } from '../../app/types';
import { CLAP_SOUND_ID, SOUNDS_THRESHOLDS } from '../../reactions/constants';
import { Sounds } from '../config/configType';

import { PLAY_SOUND } from './actionTypes';
import { playSound } from './actions';

vi.mock('../conference/functions', () => {
    return {
        getConferenceState: (state: IReduxState) => state['features/base/conference']
    };
});

const TRANSCRIPTION_ON_SOUND_ID = 'TRANSCRIPTION_ON_SOUND';
const REACTION_SOUND_ID = `${CLAP_SOUND_ID}${SOUNDS_THRESHOLDS[0]}`;

/**
 * Dispatches playSound with the given config and returns the actions it dispatched.
 *
 * @param {string} soundId - The id of the sound to play.
 * @param {Object} config - The config of the client.
 * @returns {Array<Object>}
 */
function play(soundId: string, config: Partial<IReduxState['features/base/config']> = {}) {
    const dispatch = vi.fn();
    const state = {
        'features/base/conference': {},
        'features/base/config': config
    } as unknown as IReduxState;

    playSound(soundId)(dispatch, () => state);

    return dispatch.mock.calls.map(([ action ]) => action);
}

describe('playSound', () => {
    it('plays a sound', () => {
        expect(play(TRANSCRIPTION_ON_SOUND_ID)).toEqual([ {
            type: PLAY_SOUND,
            soundId: TRANSCRIPTION_ON_SOUND_ID
        } ]);
    });

    it('does not play a disabled sound', () => {
        const soundId: Sounds = 'PARTICIPANT_JOINED_SOUND';

        expect(play(soundId, { disabledSounds: [ soundId ] })).toEqual([]);
    });

    it('does not play a sound on the recorder', () => {
        expect(play(TRANSCRIPTION_ON_SOUND_ID, { iAmRecorder: true })).toEqual([]);
    });

    it('plays the reaction sounds on the recorder', () => {
        expect(play(REACTION_SOUND_ID, { iAmRecorder: true })).toEqual([ {
            type: PLAY_SOUND,
            soundId: REACTION_SOUND_ID
        } ]);
    });

    it('plays a sound on a SIP gateway', () => {
        expect(play(TRANSCRIPTION_ON_SOUND_ID, {
            iAmRecorder: true,
            iAmSipGateway: true
        })).toEqual([ {
            type: PLAY_SOUND,
            soundId: TRANSCRIPTION_ON_SOUND_ID
        } ]);
    });
});
