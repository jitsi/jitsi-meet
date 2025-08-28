import { escape } from 'lodash-es';
import { AnyAction } from 'redux';

import { IStore } from '../../app/types';
import { SET_LOCATION_URL } from '../connection/actionTypes';
import { participantUpdated } from '../participants/actions';
import { getLocalParticipant } from '../participants/functions';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';
import { parseURLParams } from '../util/parseURLParams';

import { SETTINGS_UPDATED } from './actionTypes';
import { updateSettings } from './actions';

/**
 * The middleware of the feature base/settings. Distributes changes to the state
 * of base/settings to the states of other features computed from the state of
 * base/settings.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case SETTINGS_UPDATED:
        _updateLocalParticipant(store, action);
        break;
    case SET_LOCATION_URL:
        _updateLocalParticipantFromUrl(store);
        break;
    }

    return result;
});

/**
 * Maps the settings field names to participant names where they don't match.
 * Currently there is only one such field, but may be extended in the future.
 *
 * @private
 * @param {string} settingsField - The name of the settings field to map.
 * @returns {string}
 */
function _mapSettingsFieldToParticipant(settingsField: string) {
    switch (settingsField) {
    case 'displayName':
        return 'name';
    }

    return settingsField;
}

/**
 * Updates the local participant according to settings changes.
 *
 * @param {Store} store - The redux store.
 * @param {Object} action - The dispatched action.
 * @private
 * @returns {void}
 */
function _updateLocalParticipant({ dispatch, getState }: IStore, action: AnyAction) {
    const { settings } = action;
    const localParticipant = getLocalParticipant(getState());
    const newLocalParticipant = {
        ...localParticipant
    };

    for (const key in settings) {
        if (settings.hasOwnProperty(key)) {
            newLocalParticipant[_mapSettingsFieldToParticipant(key) as keyof typeof newLocalParticipant]
                = settings[key];
        }
    }

    dispatch(participantUpdated({
        ...newLocalParticipant,
        id: newLocalParticipant.id ?? ''
    }));
}


/**
 * Returns the userInfo set in the URL.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {void}
 */
function _updateLocalParticipantFromUrl({ dispatch, getState }: IStore) {
    const urlParams
        = parseURLParams(getState()['features/base/connection'].locationURL ?? '');
    const urlEmail = urlParams['userInfo.email'];
    const urlDisplayName = urlParams['userInfo.displayName'];

    if (!urlEmail && !urlDisplayName) {
        return;
    }

    const localParticipant = getLocalParticipant(getState());

    if (localParticipant) {
        const displayName = escape(urlDisplayName);
        const email = escape(urlEmail);

        dispatch(participantUpdated({
            ...localParticipant,
            email,
            name: displayName
        }));

        dispatch(updateSettings({
            displayName,
            email
        }));
    }
}
