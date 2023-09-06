import type { Dispatch } from 'redux';

import { participantUpdated } from '../base/participants/actions';
import { getLocalParticipant } from '../base/participants/functions';

import {
    SET_BACKGROUND_DATA
} from './actionTypes';
import {
    extractBackgroundProperties
} from './functions';

/**
 * Set background image/color for the room.
 *
 * @param {string} backgroundImageUrl - Optional image URL for the background.
 * @param {string} backgroundColor - Optional color for the background.
 * @returns {Function}
 */
export function setBackgroundImage(backgroundImageUrl: string, backgroundColor: string) {

    return async (dispatch: Dispatch<any>, getState: Function) => {
        getState();

        // dispatch(undefined);

        const state = getState();
        const localParticipant = getLocalParticipant(state);

        const previousBackgroundData = extractBackgroundProperties(localParticipant?.backgroundData);

        if (
            !state['features/base/conference']?.conference
            || (backgroundColor === previousBackgroundData?.backgroundColor
                && backgroundImageUrl === previousBackgroundData?.backgroundImageUrl)
        ) {
            return;
        }

        // Adding lastUpdate to help the synchronization of the last background set among the participants.
        const lastUpdate = Date.now();
        const backgroundData = `${backgroundColor}|${backgroundImageUrl}|${lastUpdate}`;

        // Update local participants background information
        dispatch(participantUpdated({
            id: localParticipant ? localParticipant.id : '',
            local: localParticipant?.local,
            backgroundData
        }));

    };
}

/**
 * Extract background-relevant information (if existing) from serialized background properties
 * and update the state of room-background accordingly.
 *
 * @param {string} serializedBackgroundData - Serialized background properties ('|' separated).
 * @private
 * @returns {Function}
 */
export function updateBackgroundData(serializedBackgroundData: String) {
    return (dispatch: Dispatch<any>) => {

        const backgroundDataObject = extractBackgroundProperties(serializedBackgroundData);

        return dispatch(setBackgroundData({
            backgroundColor: backgroundDataObject.backgroundColor,

            // backgroundImageUrl: backgroundDataObject.backgroundImageUrl,
            // eslint-disable-next-line max-len
            backgroundImageUrl: 'https://obs.eu-de.otc.t-systems.com/ivicos-image-upload-service/images/microsoft:a74d1ccf-4e17-41c9-bf39-fa5c15688a1e:a73bf31b-cfa5-4f2e-a18d-ec6d5f0eb8d6/c59c4a40-a110-48d4-881d-9f32b855a4a2.png',
            lastUpdate: backgroundDataObject.lastUpdate
        }));
    };
}

/**
 * Action used to set the background image/color.
 *
 * @param {Object} value - The custom data to be set.
 * @returns {Object}
 */
function setBackgroundData(value: any) {
    return {
        type: SET_BACKGROUND_DATA,
        value
    };
}
