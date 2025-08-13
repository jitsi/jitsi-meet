import { AnyAction } from 'redux';

import { IStore } from '../../app/types';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';
import { PLAY_SOUND, REGISTER_SOUND, STOP_SOUND } from './actionTypes';
import SoundManager from './SoundManager.web';

/**
 * Web-only middleware that routes sound playback through SoundManager to
 * avoid keeping many paused <audio> elements in the DOM.
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
    }

    return result;
});

import { getAudioOutputDeviceId } from '../devices/functions.web';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';

import { _ADD_AUDIO_ELEMENT } from './actionTypes';

import './middleware.any';

/**
 * Implements the entry point of the middleware of the feature base/sounds.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(_store => next => action => {

    switch (action.type) {
    case _ADD_AUDIO_ELEMENT:
        action.audioElement?.setSinkId?.(getAudioOutputDeviceId());
        break;
    }

    return next(action);
});
