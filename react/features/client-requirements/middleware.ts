import i18n from 'i18next';

import { IStore } from '../app/types';
import { CONFERENCE_JOINED } from '../base/conference/actionTypes';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { showErrorNotification, showWarningNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import logger from './logger';
import { IClientRequirements, IMissingFeature } from './types';

/**
 * Middleware that handles jicofo signaling that this client does not advertise capabilities that the deployment
 * requires.
 *
 * @param {IStore} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register((store: IStore) => (next: Function) => (action: any) => {
    switch (action.type) {
    case CONFERENCE_JOINED: {
        action.conference.on(
            JitsiConferenceEvents.CLIENT_REQUIREMENTS_NOT_MET,
            (requirements: IClientRequirements) => _onClientRequirements(store, requirements));

        break;
    }
    }

    return next(action);
});

/**
 * Describes a missing capability to the user. Uses a translation for the capability if this client has one, and
 * otherwise the description that the server sent.
 *
 * @param {IMissingFeature} missingFeature - The missing capability.
 * @returns {string}
 */
function _getDescription(missingFeature: IMissingFeature): string {
    const key = `clientRequirements.features.${missingFeature.name}`;
    const parts = [];

    if (missingFeature.name && i18n.exists(key)) {
        parts.push(i18n.t(key));
    } else if (missingFeature.details) {
        parts.push(missingFeature.details);
    } else {
        parts.push(missingFeature.name ?? missingFeature.feature);
    }

    if (missingFeature.url) {
        parts.push(missingFeature.url);
    }

    return parts.join(' ');
}

/**
 * Notifies the user that this client does not advertise capabilities that the deployment requires.
 *
 * @param {IStore} store - The redux store.
 * @param {IClientRequirements} requirements - The capabilities that the client is missing, and what the server did
 * about it.
 * @returns {void}
 */
function _onClientRequirements({ dispatch, getState }: IStore, requirements: IClientRequirements) {
    const { action, features } = requirements;

    if (!features?.length) {
        return;
    }

    const description = features.map(_getDescription).join(' ');

    logger.warn(`This client is missing required capabilities (action=${action}): `
        + `${features.map(f => f.name ?? f.feature).join(', ')}`);

    if (action === 'reject') {
        // We are not in the conference, and can not send or receive media. Show this even if warnings are hidden.
        dispatch(showErrorNotification({
            descriptionArguments: { description },
            descriptionKey: 'clientRequirements.rejectDescription',
            hideErrorSupportLink: true,
            titleKey: 'clientRequirements.rejectTitle'
        }, NOTIFICATION_TIMEOUT_TYPE.STICKY));

        return;
    }

    if (getState()['features/base/config'].hideMissingCapabilityWarnings) {
        return;
    }

    dispatch(showWarningNotification({
        descriptionArguments: { description },
        descriptionKey: 'clientRequirements.warnDescription',
        titleKey: 'clientRequirements.warnTitle'
    }, NOTIFICATION_TIMEOUT_TYPE.LONG));
}
