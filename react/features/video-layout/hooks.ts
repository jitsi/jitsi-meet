import { useSelector } from 'react-redux';

import { IReduxState } from '../app/types';
import { TILE_VIEW_ENABLED } from '../base/flags/constants';
import { getFeatureFlag } from '../base/flags/functions';

import TileViewButton from './components/TileViewButton';

const tileview = {
    key: 'tileview',
    Content: TileViewButton,
    group: 2
};

/**
 * A hook that returns the tile view button if it is enabled and undefined otherwise.
 *
 *  @returns {Object | undefined}
 */
export function useTileViewButton() {
    const tileViewEnabled = useSelector((state: IReduxState) => getFeatureFlag(state, TILE_VIEW_ENABLED, true));

    if (tileViewEnabled) {
        return tileview;
    }
}
