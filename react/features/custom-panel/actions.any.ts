import { IStore } from '../app/types';
import { getCurrentConference } from '../base/conference/functions';
import { doGetJSON } from '../base/util/httpUtils';

import { SET_CUSTOM_PANEL_ADVISOR_AVAILABLE } from './actionTypes';
import logger from './logger';

/**
 * Sets whether an advisor is deployed for the current meeting.
 *
 * @param {boolean} available - Whether an advisor is available.
 * @returns {Object} The action object.
 */
export function setCustomPanelAdvisorAvailable(available: boolean) {
    return {
        type: SET_CUSTOM_PANEL_ADVISOR_AVAILABLE,
        available
    };
}

/**
 * Asks the advisor backend whether an advisor is deployed for the current meeting. The
 * button stays hidden unless a match is confirmed, so failures are only logged.
 *
 * @returns {Function}
 */
export function resolveCustomPanelAdvisor() {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { advisorAvailabilityUrl, enabled, url: panelUrl } = state['features/base/config'].customPanel ?? {};
        const { jwt } = state['features/base/jwt'];
        const meetingId = getCurrentConference(state)?.getMeetingUniqueId();

        // Not isCustomPanelEnabled(): that depends on the result of this check.
        if (!enabled || !panelUrl || !advisorAvailabilityUrl || !jwt || !meetingId) {
            return;
        }

        let url;

        try {
            url = new URL(advisorAvailabilityUrl);
        } catch {
            logger.warn(`Invalid customPanel.advisorAvailabilityUrl: ${advisorAvailabilityUrl}`);

            return;
        }

        url.searchParams.set('token', jwt);
        url.searchParams.set('sessionId', meetingId);

        try {
            const { candidates, resolved } = await doGetJSON(url.toString());

            // The user may have left or switched rooms while the request was in flight.
            if (getCurrentConference(getState())?.getMeetingUniqueId() !== meetingId) {
                return;
            }

            // No `resolved` with several candidates means the advisor shows a picker.
            dispatch(setCustomPanelAdvisorAvailable(Boolean(resolved ?? candidates?.length)));
        } catch (err) {
            logger.warn('Failed to resolve the advisor for this meeting', err);
        }
    };
}
