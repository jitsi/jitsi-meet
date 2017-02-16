/* @flow */

import { ReducerRegistry } from '../base/redux';

import {
    CLEAR_TOOLBAR_TIMEOUT,
    SET_ALWAYS_VISIBLE_TOOLBAR,
    SET_SUBJECT,
    SET_SUBJECT_SLIDE_IN,
    SET_TOOLBAR_BUTTON,
    SET_TOOLBAR_HOVERED,
    SET_TOOLBAR_TIMEOUT,
    SET_TOOLBAR_TIMEOUT_NUMBER,
    SET_TOOLBAR_VISIBLE
} from './actionTypes';
import { getDefaultToolbarButtons } from './functions';

declare var interfaceConfig: Object;

/**
 * Returns initial state for toolbar's part of Redux store.
 *
 * @returns {{
 *     primaryToolbarButtons: Map,
 *     secondaryToolbarButtons: Map
 * }}
 * @private
 */
function _getInitialState() {
    // Default toolbar timeout for mobile app.
    let toolbarTimeout = 5000;

    if (typeof interfaceConfig !== 'undefined'
            && interfaceConfig.INITIAL_TOOLBAR_TIMEOUT) {
        toolbarTimeout = interfaceConfig.INITIAL_TOOLBAR_TIMEOUT;
    }

    return {
        /**
         * Contains default toolbar buttons for primary and secondary toolbars.
         *
         * @type {Map}
         */
        ...getDefaultToolbarButtons(),

        /**
         * Shows whether toolbar is always visible.
         *
         * @type {boolean}
         */
        alwaysVisible: false,

        /**
         * Shows whether toolbar is hovered.
         *
         * @type {boolean}
         */
        hovered: false,

        /**
         * Contains text of conference subject.
         *
         * @type {string}
         */
        subject: '',

        /**
         * Shows whether subject is sliding in.
         *
         * @type {boolean}
         */
        subjectSlideIn: false,

        /**
         * Contains toolbar timeout id.
         *
         * @type {number|null}
         */
        timeoutId: null,

        /**
         * Contains delay of toolbar timeout.
         *
         * @type {number}
         */
        toolbarTimeout,

        /**
         * Shows whether toolbar is visible.
         *
         * @type {boolean}
         */
        visible: false
    };
}

ReducerRegistry.register(
    'features/toolbar',
    (state: Object = _getInitialState(), action: Object) => {
        switch (action.type) {
        case CLEAR_TOOLBAR_TIMEOUT:
            return {
                ...state,
                timeoutId: undefined
            };

        case SET_ALWAYS_VISIBLE_TOOLBAR:
            return {
                ...state,
                alwaysVisible: action.alwaysVisible
            };

        case SET_SUBJECT:
            return {
                ...state,
                subject: action.subject
            };

        case SET_SUBJECT_SLIDE_IN:
            return {
                ...state,
                subjectSlideIn: action.subjectSlideIn
            };

        case SET_TOOLBAR_BUTTON:
            return _setButton(state, action);

        case SET_TOOLBAR_HOVERED:
            return {
                ...state,
                hovered: action.hovered
            };

        case SET_TOOLBAR_TIMEOUT:
            return {
                ...state,
                toolbarTimeout: action.toolbarTimeout,
                timeoutId: action.timeoutId
            };

        case SET_TOOLBAR_TIMEOUT_NUMBER:
            return {
                ...state,
                toolbarTimeout: action.toolbarTimeout
            };

        case SET_TOOLBAR_VISIBLE:
            return {
                ...state,
                visible: action.visible
            };
        }

        return state;
    });

/**
 * Sets new value of the button.
 *
 * @param {Object} state - Redux state.
 * @param {Object} action - Dispatched action.
 * @param {Object} action.button - Object describing toolbar button.
 * @param {Object} action.buttonName - The name of the button.
 * @returns {Object}
 * @private
 */
function _setButton(state, { buttonName, button }): Object {
    const {
        primaryToolbarButtons,
        secondaryToolbarButtons
    } = state;
    let selectedButton = primaryToolbarButtons.get(buttonName);
    let place = 'primaryToolbarButtons';

    if (!selectedButton) {
        selectedButton = secondaryToolbarButtons.get(buttonName);
        place = 'secondaryToolbarButtons';
    }

    selectedButton = {
        ...selectedButton,
        ...button
    };

    const updatedToolbar = state[place].set(buttonName, selectedButton);

    return {
        ...state,
        [place]: new Map(updatedToolbar)
    };
}
