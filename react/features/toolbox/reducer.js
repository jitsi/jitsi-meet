// @flow

import { ReducerRegistry, set } from '../base/redux';

import {
    CLEAR_TOOLBOX_TIMEOUT,
    FULL_SCREEN_CHANGED,
    SET_OVERFLOW_DRAWER,
    SET_OVERFLOW_MENU_VISIBLE,
    SET_TOOLBAR_HOVERED,
    SET_TOOLBOX_ALWAYS_VISIBLE,
    SET_TOOLBOX_ENABLED,
    SET_TOOLBOX_TIMEOUT,
    SET_TOOLBOX_TIMEOUT_MS,
    SET_TOOLBOX_VISIBLE,
    TOGGLE_TOOLBOX_VISIBLE
} from './actionTypes';

declare var interfaceConfig: Object;

/**
 * Returns initial state for toolbox's part of Redux store.
 *
 * @private
 * @returns {{
 *     alwaysVisible: boolean,
 *     enabled: boolean,
 *     hovered: boolean,
 *     overflowDrawer: boolean,
 *     overflowMenuVisible: boolean,
 *     timeoutID: number,
 *     timeoutMS: number,
 *     visible: boolean
 * }}
 */
function _getInitialState() {
    // Does the toolbar eventually fade out, or is it always visible?
    let alwaysVisible = false;

    // Toolbar (initial) visibility.
    let visible = false;

    // Default toolbox timeout for mobile app.
    let timeoutMS = 5000;

    if (typeof interfaceConfig !== 'undefined') {
        if (interfaceConfig.INITIAL_TOOLBAR_TIMEOUT) {
            timeoutMS = interfaceConfig.INITIAL_TOOLBAR_TIMEOUT;
        }
        if (typeof interfaceConfig.TOOLBAR_ALWAYS_VISIBLE !== 'undefined') {
            alwaysVisible = interfaceConfig.TOOLBAR_ALWAYS_VISIBLE;
        }
    }

    // When the toolbar is always visible, it must initially be visible too.
    if (alwaysVisible === true) {
        visible = true;
    }

    return {
        /**
         * The indicator which determines whether the Toolbox should always be
         * visible. When false, the toolbar will fade out after timeoutMS.
         *
         * @type {boolean}
         */
        alwaysVisible,

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
         * to setTimeout() with timeoutMS.
         *
         * @type {number|null}
         */
        timeoutID: null,

        /**
         * The delay in milliseconds before timeoutID executes (after its
         * initialization).
         *
         * @type {number}
         */
        timeoutMS,

        /**
         * The indicator that determines whether the Toolbox is visible.
         *
         * @type {boolean}
         */
        visible
    };
}

ReducerRegistry.register(
    'features/toolbox',
    (state: Object = _getInitialState(), action: Object) => {
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

        case SET_TOOLBOX_ALWAYS_VISIBLE:
            return {
                ...state,
                alwaysVisible: action.alwaysVisible,
                visible: action.alwaysVisible === true ? true : state.visible
            };

        case SET_TOOLBOX_ENABLED:
            return {
                ...state,
                enabled: action.enabled
            };

        case SET_TOOLBOX_TIMEOUT:
            return {
                ...state,
                timeoutID: action.timeoutID,
                timeoutMS: action.timeoutMS
            };

        case SET_TOOLBOX_TIMEOUT_MS:
            return {
                ...state,
                timeoutMS: action.timeoutMS
            };

        case SET_TOOLBOX_VISIBLE:
            return set(state, 'visible', state.alwaysVisible || action.visible);

        case TOGGLE_TOOLBOX_VISIBLE:
            return set(state, 'visible', state.alwaysVisible || !state.visible);
        }

        return state;
    });
