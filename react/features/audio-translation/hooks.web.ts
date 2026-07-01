import { useSelector } from 'react-redux';

import AudioTranslationButton from './components/web/AudioTranslationButton';
import { isAudioTranslationAvailable } from './functions';

const audioTranslation = {
    key: 'audiotranslation',
    Content: AudioTranslationButton,
    group: 2
};

/**
 * A hook that returns the audio-translation toolbar button when the feature is available to the local user,
 * and undefined otherwise. Audio translation requires the bridge translation backend (opt-in via
 * config.audioTranslation.enabled), is hidden when a moderator has disabled it for the room, and is always
 * shown to those who can manage it.
 *
 * @returns {Object | undefined}
 */
export function useAudioTranslationButton() {
    const available = useSelector(isAudioTranslationAvailable);

    if (!available) {
        return undefined;
    }

    return audioTranslation;
}
