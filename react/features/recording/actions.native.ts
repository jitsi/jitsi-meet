import { IStore } from '../app/types';
import { openSheet } from '../base/dialog/actions';
import { navigate } from '../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../mobile/navigation/routes';

import { showStartRecordingNotificationWithCallback } from './actions.any';
import HighlightDialog from './components/Recording/native/HighlightDialog';

export * from './actions.any';

/**
 * Opens the highlight dialog.
 *
 * @returns {Function}
 */
export function openHighlightDialog() {
    return (dispatch: IStore['dispatch']) => {
        dispatch(openSheet(HighlightDialog));
    };
}

/**
 * Displays the notification suggesting to start the recording.
 *
 * @returns {void}
 */
export function showStartRecordingNotification() {
    return (dispatch: IStore['dispatch']) => {
        const openDialogCallback = () => navigate(screen.conference.recording);

        dispatch(showStartRecordingNotificationWithCallback(openDialogCallback));
    };
}
