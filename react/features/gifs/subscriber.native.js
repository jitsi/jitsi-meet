import { GiphySDK } from '@giphy/react-native-sdk';

import { StateListenerRegistry } from '../base/redux';

import { isGifEnabled } from './functions';

/**
 * Listens for changes in the number of participants to calculate the dimensions of the tile view grid and the tiles.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/config']?.giphy,
    /* listener */ (_, store) => {
        const state = store.getState();

        if (isGifEnabled(state)) {
            GiphySDK.configure({ apiKey: state['features/base/config'].giphy?.sdkKey });
        }
    }, {
        deepEquals: true
    });
