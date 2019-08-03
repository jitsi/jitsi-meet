// @flow

import { ReducerRegistry,set } from '../base/redux';

import { TOGGLE_SHARE_WHITEBOARD } from './actionTypes';
const logger = require('jitsi-meet-logger').getLogger(__filename);

const DEFAULT_STATE = {
    whiteBoardOpen: false
};
ReducerRegistry.register('features/openboard', (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case TOGGLE_SHARE_WHITEBOARD: {
        logger.log('features/openboard.'+state.whiteBoardOpen);

        return set(state,'whiteBoardOpen',!state.whiteBoardOpen);
    }
    }

    return state;
});
