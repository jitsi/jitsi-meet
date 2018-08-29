import { ReducerRegistry } from '../base/redux';

import { TOGGLE_CHAT, SET_VISIBLE_PANEL, TOGGLE_SMILEY } from './actionTypes';


/**
 * Reduces the Redux actions of the feature features/side-panel.
 */
ReducerRegistry.register('features/side-panel', (state = { panelStatus: false,
    smileyPanelStatus: false }, action) => {

    switch (action.type) {

    case TOGGLE_CHAT:
        return {
            ...state,
            panelStatus: !action.panelStatus
        };

    case SET_VISIBLE_PANEL:
        return {
            ...state,
            current: action.current
        };

    case TOGGLE_SMILEY:
        return {
            ...state,
            smileyPanelStatus: !action.smileyPanelStatus
        };

    }

    return state;
});
