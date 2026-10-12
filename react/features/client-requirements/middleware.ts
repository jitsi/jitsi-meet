import i18n from 'i18next';

import { IStore } from '../app/types';
import { CONFERENCE_JOINED } from '../base/conference/actionTypes';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { showErrorNotification, showWarningNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import { getDescriptionProps } from './functions';
import logger from './logger';
import { IClientRequirements, IMissingFeature } from './types';

/**
 * Middleware that handles the server signaling that this client does not advertise capabilities that the deployment
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
function _getFeatureText(missingFeature: IMissingFeature): string {
    const key = `clientRequirements.features.${missingFeature.name}`;

    if (missingFeature.name && i18n.exists(key)) {
        return i18n.t(key);
    }

    return missingFeature.details ?? missingFeature.name ?? missingFeature.feature;
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

    logger.warn(`This client is missing required capabilities (action=${action}): `
        + `${features.map(f => f.name ?? f.feature).join(', ')}`);

    const isReject = action === 'reject';

    if (!isReject && getState()['features/base/config'].hideMissingCapabilityWarnings) {
        return;
    }

    const descriptionKey = isReject ? 'clientRequirements.rejectDescription' : 'clientRequirements.warnDescription';
    const text = [ i18n.t(descriptionKey) ].concat(features.map(_getFeatureText)).join(' ');

    // The first URL that the server sent, if any.
    const url = features.find(feature => feature.url)?.url;
    const notification = {
        ...getDescriptionProps(text, url, i18n.t.bind(i18n)),
        hideErrorSupportLink: true,
        titleKey: isReject ? 'clientRequirements.rejectTitle' : 'clientRequirements.warnTitle'
    };

    if (isReject) {
        // We are not in the conference and can not send or receive media. Show this even if warnings are hidden.
        dispatch(showErrorNotification(notification, NOTIFICATION_TIMEOUT_TYPE.STICKY));
    } else {
        dispatch(showWarningNotification(notification, NOTIFICATION_TIMEOUT_TYPE.LONG));
    }
}
