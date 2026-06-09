import { useSelector } from 'react-redux';

import { IReduxState } from '../app/types';

import AudioTranslationButton from './components/web/AudioTranslationButton';

const audioTranslation = {
    key: 'audiotranslation',
    Content: AudioTranslationButton,
    group: 2
};

/**
 * A hook that returns the audio-translation toolbar button when the feature is
 * enabled for the deployment, and undefined otherwise. Audio translation
 * requires the bridge translation backend, so it is opt-in via
 * config.audioTranslation.enabled.
 *
 * @returns {Object | undefined}
 */
export function useAudioTranslationButton() {
    const enabled = useSelector(
        (state: IReduxState) => state['features/base/config'].audioTranslation?.enabled);

    if (!enabled) {
        return undefined;
    }

    return audioTranslation;
}
