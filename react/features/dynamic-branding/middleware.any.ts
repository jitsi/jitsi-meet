import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { SET_DYNAMIC_BRANDING_DATA, SET_DYNAMIC_BRANDING_READY } from './actionTypes';
import { fetchCustomIcons } from './functions.any';
import logger from './logger';
import { getCurrentConference } from '../base/conference/functions';
import { getLocalParticipant, isLocalParticipantModerator } from '../base/participants/functions';
import { PARTICIPANT_ROLE_CHANGED } from '../base/participants/actionTypes';
import { PARTICIPANT_ROLE } from '../base/participants/constants';
import { IStateful } from '../base/app/types';
import { toState } from '../base/redux/functions';

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case SET_DYNAMIC_BRANDING_DATA: {
        const { customIcons } = action.value;

        if (customIcons) {
            fetchCustomIcons(customIcons)
                .then(localCustomIcons => {
                    action.value.brandedIcons = localCustomIcons;

                    return next(action);
                })
                .catch((error: any) => {
                    logger.error('Error fetching branded custom icons:', error);
                });
        }

        break;
    }

    case PARTICIPANT_ROLE_CHANGED: {
        const state = store.getState();
        const localParticipant = getLocalParticipant(state);

        if (localParticipant?.id !== action.participant.id
            && action.participant.role !== PARTICIPANT_ROLE.MODERATOR) {
            break;
        }

        maybeUpdatePermissions(state);

        break;
    }

    case SET_DYNAMIC_BRANDING_READY: {
        const state = store.getState();

        if (!isLocalParticipantModerator(state)) {
            break;
        }

        maybeUpdatePermissions(state);

        break;
    }
    }

    return next(action);
});

/**
 * Updates the permissions metadata for the current conference if the local participant is a moderator.
 *
 * @param {Object|Function} stateful - Object or function that can be resolved
 * to the Redux state.
 * @returns {void}
 */
function maybeUpdatePermissions(stateful: IStateful): void {
    const {
        groupChatRequiresPermission,
        pollCreationRequiresPermission
    } = toState(stateful)['features/dynamic-branding'];

    if (groupChatRequiresPermission || pollCreationRequiresPermission) {
        const conference = getCurrentConference(stateful);

        if (!conference) {
            return;
        }

        const permissions: {
            groupChatRestricted?: boolean;
            pollCreationRestricted?: boolean;
        } = conference.getMetadataHandler().getMetadata().permissions || {};
        let sendUpdate = false;

        if (groupChatRequiresPermission && !permissions.groupChatRestricted) {
            permissions.groupChatRestricted = true;
            sendUpdate = true;
        }

        if (pollCreationRequiresPermission && !permissions.pollCreationRestricted) {
            permissions.pollCreationRestricted = true;
            sendUpdate = true;
        }

        if (sendUpdate) {
            conference.getMetadataHandler().setMetadata('permissions', permissions);
        }
    }
}
