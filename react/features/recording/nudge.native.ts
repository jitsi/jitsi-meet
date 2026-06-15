import i18next from '../base/i18n/i18next';
import { navigate }
    from '../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../mobile/navigation/routes';

import { registerNudgeProvider } from './middleware';

registerNudgeProvider((scenario: 'recording' | 'transcription') => {
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
});
