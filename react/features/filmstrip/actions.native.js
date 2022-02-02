// @flow

import { getParticipantCountWithFake } from '../base/participants';

import { SET_TILE_VIEW_DIMENSIONS } from './actionTypes';
import { SQUARE_TILE_ASPECT_RATIO, TILE_MARGIN } from './constants';
import { getColumnCount } from './functions.native';

export * from './actions.any';

/**
 * Sets the dimensions of the tile view grid. The action is only partially implemented on native as not all
 * of the values are currently used. Check the description of {@link SET_TILE_VIEW_DIMENSIONS} for the full set
 * of properties.
 *
 * @returns {Function}
 */
export function setTileViewDimensions() {
    return (dispatch: Function, getState: Function) => {
        const state = getState();
        const participantCount = getParticipantCountWithFake(state);
        const { clientHeight: height, clientWidth: width } = state['features/base/responsive-ui'];
        const columns = getColumnCount(state);
        const heightToUse = height - (TILE_MARGIN * 2);
        const widthToUse = width - (TILE_MARGIN * 2);
        let tileWidth;

        // If there is going to be at least two rows, ensure that at least two
        // rows display fully on screen.
        if (participantCount / columns > 1) {
            tileWidth = Math.min(widthToUse / columns, heightToUse / 2);
        } else {
            tileWidth = Math.min(widthToUse / columns, heightToUse);
        }

        const tileHeight = Math.floor(tileWidth / SQUARE_TILE_ASPECT_RATIO);

        tileWidth = Math.floor(tileWidth);


        dispatch({
            type: SET_TILE_VIEW_DIMENSIONS,
            dimensions: {
                columns,
                thumbnailSize: {
                    height: tileHeight,
                    width: tileWidth
                }
            }
        });
    };
}
