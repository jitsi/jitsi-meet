import AudioTranslationButton from './components/web/AudioTranslationButton';

const audioTranslation = {
    key: 'audiotranslation',
    Content: AudioTranslationButton,
    group: 2
};

/**
 * A hook that returns the audio-translation toolbar button.
 *
 * @returns {Object}
 */
export function useAudioTranslationButton() {
    return audioTranslation;
}
