// @flow

import { styles as conferenceStyles } from '../conference';

import { SET_TILE_VIEW_DIMENSIONS } from './actionTypes';
import { styles } from './components';
import { SQUARE_TILE_ASPECT_RATIO, TILE_MARGIN } from './constants';
import { getColumnCount } from './functions';
import { getTileViewParticipantCount } from './functions.native';

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
        const participantCount = getTileViewParticipantCount(state);
        const { clientHeight: height, clientWidth: width, safeAreaInsets = {} } = state['features/base/responsive-ui'];
        const columns = getColumnCount(state);
        const rows = Math.ceil(participantCount / columns);
        const conferenceBorder = conferenceStyles.conference.borderWidth || 0;
        const heightToUse = height - (safeAreaInsets.top || 0) - (2 * conferenceBorder);
        const widthToUse = width - (TILE_MARGIN * 2) - (safeAreaInsets.left || 0)
            - (safeAreaInsets.right || 0) - (2 * conferenceBorder);
        let tileWidth;

        // If there is going to be at least two rows, ensure that at least two
        // rows display fully on screen.
        if (rows / columns > 1) {
            tileWidth = Math.min(widthToUse / columns, heightToUse / 2);
        } else {
            tileWidth = Math.min(widthToUse / columns, heightToUse);
        }

        const tileHeight = Math.floor(tileWidth / SQUARE_TILE_ASPECT_RATIO);

        tileWidth = Math.floor(tileWidth);

        // Adding safeAreaInsets.bottom to the total height of all thumbnails because we add it as a padding to the
        // thumbnails container.
        const hasScroll = heightToUse < ((tileHeight + (2 * styles.thumbnail.margin)) * rows) + safeAreaInsets.bottom;

        dispatch({
            type: SET_TILE_VIEW_DIMENSIONS,
            dimensions: {
                columns,
                thumbnailSize: {
                    height: tileHeight,
                    width: tileWidth
                },
                hasScroll
            }
        });
    };
}
