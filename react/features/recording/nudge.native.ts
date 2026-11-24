import { IStore } from '../app/types';
import i18next from '../base/i18n/i18next';
import { navigate }
    from '../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../mobile/navigation/routes';

import { INudge } from './actions.any';

/**
 * Returns the nudge notification payload for the given scenario.
 *
 * @param {string} scenario - Which service just started.
 * @param {Function} _dispatch - Unused on native (navigation handles the action).
 * @returns {Object}
 */
export function getNudge(scenario: 'recording' | 'transcription', _dispatch: IStore['dispatch']): INudge {
    if (scenario === 'recording') {
        return {
            descriptionText: `· ${i18next.t('recording.alsoTranscribe')}`,
            actionNameKey: 'dialog.startTranscribing',
            handler: () => navigate(screen.conference.recording)
        };
    }

    return {
        descriptionText: `· ${i18next.t('transcribing.alsoRecord')}`,
        actionNameKey: 'dialog.startRecording',
        handler: () => navigate(screen.conference.recording)
    };
}
