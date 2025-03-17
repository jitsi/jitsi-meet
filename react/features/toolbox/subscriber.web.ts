import { throttle } from 'lodash-es';

import { IReduxState, IStore } from '../app/types';
import { getParticipantCount } from '../base/participants/functions';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { DEFAULT_MAX_COLUMNS } from '../filmstrip/constants';
import { isLayoutTileView } from '../video-layout/functions.any';

import { setShiftUp } from './actions.any';
import { isAudioMuteButtonDisabled } from './functions.any';

/**
 * Notifies when audio availability changes.
 */
StateListenerRegistry.register(
    /* selector */ (state: IReduxState) => isAudioMuteButtonDisabled(state),
    /* listener */ (disabled: boolean, store: IStore, previousDisabled: boolean) => {
        if (disabled !== previousDisabled) {
            APP.API.notifyAudioAvailabilityChanged(!disabled);
        }
    }
);


const checkToolboxOverlap = (clientHeight: number, store: IStore) => {
    let toolboxRect = document.querySelector('.toolbox-content-items')?.getBoundingClientRect();

    if (!toolboxRect) {
        return;
    }
    const tiles = document.querySelectorAll('span.videocontainer');

    if (!tiles.length) {
        return;
    }

    const toolboxHeight = 48 + 12; // height + padding
    const bottomMargin = 16;

    // Set top and bottom manually to avoid wrong coordinates
    // caused by the hiding/ showing of the toolbox.
    toolboxRect = {
        ...toolboxRect,
        top: clientHeight - toolboxHeight - bottomMargin,
        bottom: clientHeight - bottomMargin,
        left: toolboxRect.left,
        right: toolboxRect.right
    };
    let isIntersecting = false;

    const rows = store.getState()['features/filmstrip'].tileViewDimensions?.gridDimensions?.rows;
    const noOfTilesToCheck = rows === 1 ? tiles.length : DEFAULT_MAX_COLUMNS - 1;

    for (let i = 1; i < Math.max(noOfTilesToCheck, tiles.length); i++) {
        const tile = tiles[tiles.length - i];
        const indicatorsRect = tile?.querySelector('.bottom-indicators')?.getBoundingClientRect();

        if (!indicatorsRect) {
            continue;
        }

        if (indicatorsRect.top <= toolboxRect.bottom
            && indicatorsRect.right >= toolboxRect.left
            && indicatorsRect.bottom >= toolboxRect.top
            && indicatorsRect.left <= toolboxRect.right
        ) {
            isIntersecting = true;
            break;
        }
    }

    store.dispatch(setShiftUp(isIntersecting));
};

const throttledCheckOverlap = throttle(checkToolboxOverlap, 100, {
    leading: false,
    trailing: true
});

/**
 * Listens for changes in the selected layout to calculate the dimensions of the tile view grid and horizontal view.
 */
StateListenerRegistry.register(
    /* selector */ state => {
        const { clientHeight, clientWidth } = state['features/base/responsive-ui'];

        return {
            participantCount: getParticipantCount(state),
            clientHeight,
            clientWidth,
            isTileView: isLayoutTileView(state)
        };
    },
    /* listener */({ clientHeight, isTileView }, store, previousState) => {
        if (!isTileView) {
            if (previousState?.isTileView) {
                store.dispatch(setShiftUp(false));
            }

            return;
        }
        throttledCheckOverlap(clientHeight, store);

    }, {
        deepEquals: true
    });
