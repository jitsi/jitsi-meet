import { IStore } from '../../app/types';
// import { setLastN } from '../lastn/actions';
// import logger from '../video-stream/logger';

import { TOGGLE_VIDEO_STREAM } from './actionTypes';

export function toggleVideoStream(enable?: boolean) {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        let finalEnable = enable;

        if (enable === undefined) {
            // if not parameter passed in, just invert the state
            finalEnable = !getState()['features/base/video-stream'].enable;
        }

        await dispatch({
            type: TOGGLE_VIDEO_STREAM,
            enable: finalEnable
        });

        /* // change of lastN is consolidated in _updateLastN() function in lastn/middleware.ts
        let nextLastN;

        if (finalEnable) {
            const config = getState()['features/base/config'];
            const { enabled: filmStripEnabled } = getState()['features/filmstrip'];

            nextLastN = !filmStripEnabled
                ? 1
                // Select the (initial) lastN value based on the following preference order.
                // 1. The last-n value from 'startLastN' if it is specified in config.js
                // 2. The last-n value from 'channelLastN' if specified in config.js.
                // 3. -1 as the default value.
                : config.startLastN ?? (config.channelLastN ?? -1);

        } else {
            nextLastN = 0;
        }

        logger.debug('[GTS] ToggleVideoStream', { enable, setLastN: nextLastN });
        dispatch(setLastN(nextLastN));
        */
    };
}
