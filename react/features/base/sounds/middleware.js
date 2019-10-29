// @flow

import { MiddlewareRegistry } from '../redux';

import { PLAY_SOUND, STOP_SOUND } from './actionTypes';
import logger from './logger';

/**
 * Implements the entry point of the middleware of the feature base/media.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case PLAY_SOUND:
        _playSound(store, action.soundId);
        break;
    case STOP_SOUND:
        _stopSound(store, action.soundId);
        break;
    }

    return next(action);
});

/**
 * Plays sound from audio element registered in the Redux store.
 *
 * @param {Store} store - The Redux store instance.
 * @param {string} soundId - Audio element identifier.
 * @private
 * @returns {void}
 */
function _playSound({ getState }, soundId) {
    const sounds = getState()['features/base/sounds'];
    const sound = sounds.get(soundId);

    if (sound) {
        if (sound.audioElement) {
            sound.audioElement.play();
        } else {
            logger.warn(`PLAY_SOUND: sound not loaded yet for id: ${soundId}`);
        }
    } else {
        logger.warn(`PLAY_SOUND: no sound found for id: ${soundId}`);
    }
}

/**
 * Stop sound from audio element registered in the Redux store.
 *
 * @param {Store} store - The Redux store instance.
 * @param {string} soundId - Audio element identifier.
 * @private
 * @returns {void}
 */
function _stopSound({ getState }, soundId) {
    const sounds = getState()['features/base/sounds'];
    const sound = sounds.get(soundId);

    if (sound) {
        const { audioElement } = sound;

        if (audioElement) {
            audioElement.stop();
        } else {
            logger.warn(`STOP_SOUND: sound not loaded yet for id: ${soundId}`);
        }
    } else {
        logger.warn(`STOP_SOUND: no sound found for id: ${soundId}`);
    }
}
