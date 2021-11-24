// @flow

import { getCurrentConference } from '../base/conference';
import { toState } from '../base/redux';

import ScreenshotCaptureSummary from './ScreenshotCaptureSummary';

/**
 * Creates a new instance of ScreenshotCapture.
 *
 * @param {Object | Function} stateful - The redux store, state, or
 * {@code getState} function.
 * @returns {Promise<ScreenshotCapture>}
 */
export function createScreenshotCaptureSummary(stateful: Object | Function) {
    if (!MediaStreamTrack.prototype.getSettings && !MediaStreamTrack.prototype.getConstraints) {
        return Promise.reject(new Error('ScreenshotCaptureSummary not supported!'));
    }

    return new ScreenshotCaptureSummary(toState(stateful));
}

/**
 * Get a participant's connection JID given its ID.
 *
 * @param {Object} state - The redux store state.
 * @param {string} participantId - ID of the given participant.
 * @returns {string|undefined} - The participant connection JID if found.
 */
export function getParticipantJid(state: Object, participantId: string) {
    const conference = getCurrentConference(state);

    if (!conference) {
        return;
    }

    const participant = conference.getParticipantById(participantId);

    if (!participant) {
        return;
    }

    return participant.getJid();
}
