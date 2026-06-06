import i18next from 'i18next';

import { registerE2eeAudioFiles } from '../../../features/e2ee/functions';
import { registerRecordingAudioFiles } from '../../../features/recording/functions';
import { IStore } from '../../app/types';
import { AudioSupportedLanguage } from '../media/constants';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';
import StateListenerRegistry from '../redux/StateListenerRegistry';

import { PLAY_SOUND, STOP_SOUND } from './actionTypes';
import logger from './logger';

/**
 * Implements the entry point of the middleware of the feature base/sounds.
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
function _playSound({ getState }: IStore, soundId: string) {
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
function _stopSound({ getState }: IStore, soundId: string) {
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

/**
 * Returns whether the language is supported for audio messages.
 *
 * @param {string} language - The requested language.
 * @returns {boolean}
 */
function isLanguageSupported(language: string): Boolean {
    return Boolean(AudioSupportedLanguage[language as keyof typeof AudioSupportedLanguage]);
}

/**
 * Checking if it's necessary to reload the translated files.
 *
 * @param {string} language - The next language.
 * @param {string} prevLanguage - The previous language.
 * @returns {boolean}
 */
function shouldReloadAudioFiles(language: string, prevLanguage: string): Boolean {
    const isNextLanguageSupported = isLanguageSupported(language);
    const isPrevLanguageSupported = isLanguageSupported(prevLanguage);

    return (

        // From an unsupported language (which defaulted to English) to a supported language (that isn't English).
        isNextLanguageSupported && language !== AudioSupportedLanguage.en && !isPrevLanguageSupported
    ) || (

        // From a supported language (that wasn't English) to English.
        !isNextLanguageSupported && isPrevLanguageSupported && prevLanguage !== AudioSupportedLanguage.en
    ) || (

        // From a supported language to another.
        isNextLanguageSupported && isPrevLanguageSupported
    );
}

/**
 * Set up state change listener for language.
 */
StateListenerRegistry.register(
    () => i18next.language,
    (language, { dispatch }, prevLanguage): void => {

        if (language !== prevLanguage && shouldReloadAudioFiles(language, prevLanguage)) {
            registerE2eeAudioFiles(dispatch, true);
            registerRecordingAudioFiles(dispatch, true);
        }
    }
);
