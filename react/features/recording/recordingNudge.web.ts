import { IStore } from '../app/types';
import { openDialog } from '../base/dialog/actions';
import i18next from '../base/i18n/i18next';

import RecordingTranscriptionDialog from './components/Recording/web/RecordingTranscriptionDialog';
import { registerNudgeProvider } from './middleware';

/**
 * Registers the web-specific nudge provider.
 *
 * When only recording or only transcription starts, the "started" notification
 * will include a description and action button offering to start the other service.
 */
registerNudgeProvider((scenario: 'recording' | 'transcription', dispatch: IStore['dispatch']) => {
    if (scenario === 'recording') {
        return {
            descriptionText: `· ${i18next.t('recording.alsoTranscribe')}`,
            actionNameKey: 'dialog.startTranscription',
            handler: () => dispatch(openDialog('RecordingTranscriptionDialog', RecordingTranscriptionDialog, {
                recordAudioAndVideo: false,
                initialTranscription: true
            }))
        };
    }

    return {
        descriptionText: `· ${i18next.t('transcribing.alsoRecord')}`,
        actionNameKey: 'dialog.startRecording',
        handler: () => dispatch(openDialog('RecordingTranscriptionDialog', RecordingTranscriptionDialog, {
            initialRecording: true
        }))
    };
});
