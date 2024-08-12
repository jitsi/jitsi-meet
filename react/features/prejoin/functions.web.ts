import { batch } from 'react-redux';

import { IStore } from '../app/types';
import { trackAdded } from '../base/tracks/actions.any';

import { PREJOIN_INITIALIZED } from './actionTypes';
import { setPrejoinDeviceErrors } from './actions.web';

export * from './functions.any';

/**
 * Adds all the newly created tracks to store on init.
 *
 * @param {Object[]} tracks - The newly created tracks.
 * @param {Object} errors - The errors from creating the tracks.
 * @param {Function} dispatch - The redux dispatch function.
 * @returns {void}
 */
export function initPrejoin(tracks: Object[], errors: Object, dispatch?: IStore['dispatch']) {
    if (!dispatch) {
        return;
    }

    batch(() => {
        dispatch(setPrejoinDeviceErrors(errors));
        dispatch({
            type: PREJOIN_INITIALIZED
        });

        tracks.forEach(track => dispatch(trackAdded(track)));
    });
}
