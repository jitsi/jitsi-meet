import { CONFERENCE_UNIQUE_ID_SET } from '../base/conference/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { SET_DYNAMIC_BRANDING_DATA } from '../dynamic-branding/actionTypes';

import { resolveCustomPanelAdvisor } from './actions.any';

/**
 * Checks whether an advisor is deployed for the meeting. The check needs the meeting id and
 * the branding URL, which can arrive in any order, so it runs after each.
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    // The meeting id is required by the check. It arrives after joining, when the deployment provides one.
    case CONFERENCE_UNIQUE_ID_SET:
    case SET_DYNAMIC_BRANDING_DATA:
        store.dispatch(resolveCustomPanelAdvisor());
        break;
    }

    return result;
});
