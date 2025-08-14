import { AnyAction } from 'redux';

import { IStore } from '../../app/types';
import { getAudioOutputDeviceId } from '../devices/functions.web';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';

import './middleware.any';

import SoundManager from './SoundManager.web';
import { PLAY_SOUND, REGISTER_SOUND, STOP_SOUND, _ADD_AUDIO_ELEMENT } from './actionTypes';

/**
 * Web-only middleware that routes sound playback through SoundManager to
 * avoid keeping many paused <audio> elements in the DOM.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register((store: IStore) => next => (action: AnyAction) => {
    const result = next(action);

    switch (action.type) {
    case PLAY_SOUND: {
        const { soundId } = action;
        const sounds = store.getState()['features/base/sounds'];
        const sound = sounds.get(soundId);

        if (sound?.src) {
            const loop = Boolean(sound.options?.loop);

            SoundManager.play(soundId, String(sound.src), loop);
        }
        break;
    }
    case STOP_SOUND: {
        const { soundId } = action;

        SoundManager.stop(soundId);
        break;
    }
    case REGISTER_SOUND: {
        // No-op; elements are created on demand by SoundManager
        break;
    }
    case _ADD_AUDIO_ELEMENT:
        action.audioElement?.setSinkId?.(getAudioOutputDeviceId());
        break;
    }

    return result;
});
