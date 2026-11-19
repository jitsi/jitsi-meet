// @ts-expect-error
import { FEEDBACK_REQUEST_IN_PROGRESS } from '../../../modules/UI/UIErrors';
import { IStore } from '../app/types';
import { IJitsiConference } from '../base/conference/reducer';

import { openFeedbackDialog } from './actions.any';
import FeedbackDialog from './components/FeedbackDialog.web';
import { shouldSendJaaSFeedbackMetadata } from './functions';

export * from './actions.any';

/**
 * Potentially open the {@code FeedbackDialog}. It will not be opened if it is
 * already open or feedback has already been submitted.
 *
 * @param {JistiConference} conference - The conference for which the feedback
 * would be about. The conference is passed in because feedback can occur after
 * a conference has been left, so references to it may no longer exist in redux.
 * @param {string} title - The feedback dialog title.
 * @returns {Promise} Resolved with value - false if the dialog is enabled and
 * resolved with true if the dialog is disabled or the feedback was already
 * submitted. Rejected if another dialog is already displayed.
 */
export function maybeOpenFeedbackDialog(conference: IJitsiConference, title?: string) {
    type R = {
        feedbackSubmitted: boolean;
        showThankYou: boolean;
        wasDialogShown: boolean;
    };

    return (dispatch: IStore['dispatch'], getState: IStore['getState']): Promise<R> => {
        const state = getState();
        const { feedbackPercentage = 100 } = state['features/base/config'];

        if (config.iAmRecorder) {
            // Intentionally fall through the if chain to prevent further action
            // from being taken with regards to showing feedback.
        } else if (state['features/base/dialog'].component === FeedbackDialog) {
            // Feedback is currently being displayed.

            return Promise.reject(FEEDBACK_REQUEST_IN_PROGRESS);
        } else if (state['features/feedback'].submitted) {
            // Feedback has been submitted already.

            return Promise.resolve({
                feedbackSubmitted: true,
                showThankYou: true,
                wasDialogShown: false
            });
        } else if (shouldSendJaaSFeedbackMetadata(state)
                && feedbackPercentage > Math.random() * 100) {
            return new Promise(resolve => {
                dispatch(openFeedbackDialog(conference, title, () => {
                    const { submitted } = getState()['features/feedback'];

                    resolve({
                        feedbackSubmitted: submitted,
                        showThankYou: false,
                        wasDialogShown: true
                    });
                }));
            });
        }

        // If the feedback functionality isn't enabled we show a "thank you"
        // message. Signaling it (true), so the caller of requestFeedback can
        // act on it.
        return Promise.resolve({
            feedbackSubmitted: false,
            showThankYou: true,
            wasDialogShown: false
        });
    };
}
