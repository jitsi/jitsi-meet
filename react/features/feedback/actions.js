import { openDialog } from '../../features/base/dialog';

import {
    CANCEL_FEEDBACK,
    SET_SHOULD_SHOW_POST_CALL_FEEDBACK,
    SUBMIT_FEEDBACK
} from './actionTypes';
import { FeedbackDialog } from './components';

declare var APP: Object;

/**
 * Caches the passed in feedback in the redux store.
 *
 * @param {number} score - The quality score given to the conference.
 * @param {string} message - A description entered by the participant that
 * explains the rating.
 * @returns {{
 *     type: CANCEL_FEEDBACK,
 *     message: string,
 *     score: number
 * }}
 */
export function cancelFeedback(score, message) {
    return {
        type: CANCEL_FEEDBACK,
        message,
        score
    };
}

/**
 * Opens {@code FeedbackDialog}.
 *
 * @param {JitsiConference} conference - The JitsiConference that is being
 * rated. The conference is passed in because feedback can occur after a
 * onference has been left, so references to it may no longer exist in redux.
 * @param {Function} [onClose] - An optional callback to invoke when the dialog
 * is closed.
 * @returns {Object}
 */
export function openFeedbackDialog(conference, onClose) {
    return openDialog(FeedbackDialog, {
        conference,
        onClose
    });
}

/**
 * Sets whether or not feedback should display automatically at the end of the
 * conference.
 *
 * @param {boolean} shouldShow - Whether or not feedback should display at the
 * end of the conference.
 * @returns {{
 *     type: SET_SHOULD_SHOW_POST_CALL_FEEDBACK,
 *     shouldShow: boolean
 * }}
 */
export function shouldShowPostCallFeedbackDialog(shouldShow) {
    return {
        type: SET_SHOULD_SHOW_POST_CALL_FEEDBACK,
        shouldShow
    };
}

/**
 * Send the passed in feedback.
 *
 * @param {number} score - An integer between 1 and 5 indicating the user
 * feedback. The negative integer -1 is used to denote no score was selected.
 * @param {string} message - Detailed feedback from the user to explain the
 * rating.
 * @param {JitsiConference} conference - The JitsiConference for which the
 * feedback is being left.
 * @returns {{
 *     type: SUBMIT_FEEDBACK
 * }}
 */
export function submitFeedback(score, message, conference) {
    conference.sendFeedback(score, message);

    return {
        type: SUBMIT_FEEDBACK
    };
}
