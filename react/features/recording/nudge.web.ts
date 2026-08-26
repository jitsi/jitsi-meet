import { IStore } from '../app/types';
import { openDialog } from '../base/dialog/actions';
import i18next from '../base/i18n/i18next';

import { INudge } from './actions.any';
import RecordingTranscriptionDialog from './components/Recording/web/RecordingTranscriptionDialog';

/**
 * Returns the nudge notification payload for the given scenario.
 *
 * @param {string} scenario - Which service just started.
 * @param {Function} dispatch - The Redux dispatch function.
 * @returns {Object}
 */
export function getNudge(scenario: 'recording' | 'transcription', dispatch: IStore['dispatch']): INudge {
    if (scenario === 'recording') {
        return {
            descriptionText: `· ${i18next.t('recording.alsoTranscribe')}`,
            actionNameKey: 'dialog.startTranscribing',
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
}
