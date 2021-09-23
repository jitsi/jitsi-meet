// @flow

import { ReducerRegistry, set } from '../base/redux';

import {
    CLEAR_TOOLBOX_TIMEOUT,
    FULL_SCREEN_CHANGED,
    SET_OVERFLOW_DRAWER,
    SET_OVERFLOW_MENU_VISIBLE,
    SET_TOOLBAR_HOVERED,
    SET_TOOLBOX_ENABLED,
    SET_TOOLBOX_TIMEOUT,
    SET_TOOLBOX_VISIBLE,
    TOGGLE_TOOLBOX_VISIBLE
} from './actionTypes';

/**
 * Initial state of toolbox's part of Redux store.
 */
const INITIAL_STATE = {

    /**
     * The indicator which determines whether the Toolbox is enabled.
     *
     * @type {boolean}
     */
    enabled: true,

    /**
     * The indicator which determines whether a Toolbar in the Toolbox is
     * hovered.
     *
     * @type {boolean}
     */
    hovered: false,

    /**
     * The indicator which determines whether the overflow menu(s) are to be displayed as drawers.
     *
     * @type {boolean}
     */
    overflowDrawer: false,

    /**
     * The indicator which determines whether the OverflowMenu is visible.
     *
     * @type {boolean}
     */
    overflowMenuVisible: false,

    /**
     * A number, non-zero value which identifies the timer created by a call
     * to setTimeout().
     *
     * @type {number|null}
     */
    timeoutID: null,


    /**
     * The indicator that determines whether the Toolbox is visible.
     *
     * @type {boolean}
     */
    visible: false
};

ReducerRegistry.register(
    'features/toolbox',
    (state: Object = INITIAL_STATE, action: Object) => {
        switch (action.type) {
        case CLEAR_TOOLBOX_TIMEOUT:
            return {
                ...state,
                timeoutID: undefined
            };

        case FULL_SCREEN_CHANGED:
            return {
                ...state,
                fullScreen: action.fullScreen
            };

        case SET_OVERFLOW_DRAWER:
            return {
                ...state,
                overflowDrawer: action.displayAsDrawer
            };

        case SET_OVERFLOW_MENU_VISIBLE:
            return {
                ...state,
                overflowMenuVisible: action.visible
            };

        case SET_TOOLBAR_HOVERED:
            return {
                ...state,
                hovered: action.hovered
            };

        case SET_TOOLBOX_ENABLED:
            return {
                ...state,
                enabled: action.enabled
            };

        case SET_TOOLBOX_TIMEOUT:
            return {
                ...state,
                timeoutID: action.timeoutID
            };

        case SET_TOOLBOX_VISIBLE:
            return set(state, 'visible', action.visible);

        case TOGGLE_TOOLBOX_VISIBLE:
            return set(state, 'visible', !state.visible);
        }

        return state;
    });
