import { IStore } from '../app/types';
import { IJitsiConference } from '../base/conference/reducer';
import { openDialog } from '../base/dialog/actions';
import { extractFqnFromPath } from '../dynamic-branding/functions.any';

import {
    CANCEL_FEEDBACK,
    SUBMIT_FEEDBACK_ERROR,
    SUBMIT_FEEDBACK_SUCCESS
} from './actionTypes';
import FeedbackDialog from './components/FeedbackDialog';
import { sendFeedbackToJaaSRequest, shouldSendJaaSFeedbackMetadata } from './functions';

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
export function cancelFeedback(score: number, message: string) {
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
 * conference has been left, so references to it may no longer exist in redux.
 * @param {string} [title] - The feedback dialog title.
 * @param {Function} [onClose] - An optional callback to invoke when the dialog
 * is closed.
 * @returns {Object}
 */
export function openFeedbackDialog(conference?: IJitsiConference, title?: string, onClose?: Function) {
    return openDialog('FeedbackDialog', FeedbackDialog, {
        conference,
        onClose,
        title
    });
}

/**
 * Sends feedback metadata to JaaS endpoint.
 *
 * @param {JitsiConference} conference - The JitsiConference that is being rated.
 * @param {Object} feedback - The feedback message and score.
 *
 * @returns {Promise}
 */
export function sendJaasFeedbackMetadata(conference: IJitsiConference, feedback: Object) {
    return (_dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();

        if (!shouldSendJaaSFeedbackMetadata(state)) {
            return Promise.resolve();
        }

        const { jaasFeedbackMetadataURL } = state['features/base/config'];
        const { jwt, user, tenant } = state['features/base/jwt'];
        const meetingFqn = extractFqnFromPath(state);
        const feedbackData = {
            ...feedback,
            sessionId: conference.sessionId,
            userId: user?.id,
            meetingFqn,
            jwt,
            tenant
        };

        return sendFeedbackToJaaSRequest(jaasFeedbackMetadataURL, feedbackData);
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
 * @returns {Function}
 */
export function submitFeedback(
        score: number,
        message: string,
        conference: IJitsiConference) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const promises = [];

        if (shouldSendJaaSFeedbackMetadata(state)) {
            promises.push(dispatch(sendJaasFeedbackMetadata(conference, {
                score,
                message
            })));
        }

        return Promise.allSettled(promises)
        .then(results => {
            const rejected = results.find((result): result is PromiseRejectedResult => result?.status === 'rejected');

            if (typeof rejected === 'undefined') {
                dispatch({ type: SUBMIT_FEEDBACK_SUCCESS });

                return Promise.resolve();
            }

            const error = rejected.reason;

            dispatch({
                type: SUBMIT_FEEDBACK_ERROR,
                error
            });

            return Promise.reject(error);
        });
    };
}

