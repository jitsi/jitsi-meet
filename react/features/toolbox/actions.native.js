/* @flow */

import type { Dispatch } from 'redux-thunk';

import {
    CLEAR_TOOLBOX_TIMEOUT,
    SET_SUBJECT,
    SET_SUBJECT_SLIDE_IN,
    SET_TOOLBAR_BUTTON,
    SET_TOOLBAR_HOVERED,
    SET_TOOLBOX_ALWAYS_VISIBLE,
    SET_TOOLBOX_ENABLED,
    SET_TOOLBOX_TIMEOUT,
    SET_TOOLBOX_TIMEOUT_MS,
    SET_TOOLBOX_VISIBLE
} from './actionTypes';

/**
 * FIXME: We should make sure all common functions for native and web are
 * merged in a global functions file.
 */
import { getButton } from './functions.native';

/**
 * Event handler for local raise hand changed event.
 *
 * @param {boolean} handRaised - Flag showing whether hand is raised.
 * @returns {Function}
 */
export function changeLocalRaiseHand(handRaised: boolean): Function {
    return (dispatch: Dispatch<*>, getState: Function) => {
        const buttonName = 'raisehand';
        const button = getButton(buttonName, getState());

        button.toggled = handRaised;

        dispatch(setToolbarButton(buttonName, button));
    };
}

/**
 * Signals that toolbox timeout should be cleared.
 *
 * @returns {{
 *     type: CLEAR_TOOLBOX_TIMEOUT
 * }}
 */
export function clearToolboxTimeout(): Object {
    return {
        type: CLEAR_TOOLBOX_TIMEOUT
    };
}

/**
 * Enables/disables audio toolbar button.
 *
 * @param {boolean} enabled - True if the button should be enabled; otherwise,
 * false.
 * @returns {Function}
 */
export function setAudioIconEnabled(enabled: boolean = false): Function {
    return (dispatch: Dispatch<*>) => {
        const i18nKey = enabled ? 'mute' : 'micDisabled';
        const i18n = `[content]toolbar.${i18nKey}`;
        const button = {
            enabled,
            i18n,
            toggled: !enabled
        };

        dispatch(setToolbarButton('microphone', button));
    };
}

/**
 * Signals that value of conference subject should be changed.
 *
 * @param {string} subject - Conference subject string.
 * @returns {Object}
 */
export function setSubject(subject: string): Object {
    return {
        type: SET_SUBJECT,
        subject
    };
}

/**
 * Signals that toolbox subject slide in value should be changed.
 *
 * @param {boolean} subjectSlideIn - True if the subject is shown; otherwise,
 * false.
 * @returns {{
 *     type: SET_SUBJECT_SLIDE_IN,
 *     subjectSlideIn: boolean
 * }}
 */
export function setSubjectSlideIn(subjectSlideIn: boolean): Object {
    return {
        type: SET_SUBJECT_SLIDE_IN,
        subjectSlideIn
    };
}

/**
 * Signals that value of the button specified by key should be changed.
 *
 * @param {string} buttonName - Button key.
 * @param {Object} button - Button object.
 * @returns {{
 *     type: SET_TOOLBAR_BUTTON,
 *     button: Object,
 *     buttonName: string
 * }}
 */
export function setToolbarButton(buttonName: string, button: Object): Object {
    return {
        type: SET_TOOLBAR_BUTTON,
        button,
        buttonName
    };
}

/**
 * Signals that toolbar is hovered value should be changed.
 *
 * @param {boolean} hovered - Flag showing whether toolbar is hovered.
 * @returns {{
 *     type: SET_TOOLBAR_HOVERED,
 *     hovered: boolean
 * }}
 */
export function setToolbarHovered(hovered: boolean): Object {
    return {
        type: SET_TOOLBAR_HOVERED,
        hovered
    };
}

/**
 * Signals that always visible toolbars value should be changed.
 *
 * @param {boolean} alwaysVisible - Value to be set in redux store.
 * @returns {{
 *     type: SET_TOOLBOX_ALWAYS_VISIBLE,
 *     alwaysVisible: boolean
 * }}
 */
export function setToolboxAlwaysVisible(alwaysVisible: boolean): Object {
    return {
        type: SET_TOOLBOX_ALWAYS_VISIBLE,
        alwaysVisible
    };
}

/* eslint-disable flowtype/space-before-type-colon */

/**
 * Enables/disables the toolbox.
 *
 * @param {boolean} enabled - True to enable the toolbox or false to disable it.
 * @returns {{
 *     type: SET_TOOLBOX_ENABLED,
 *     enabled: boolean
 * }}
 */
export function setToolboxEnabled(enabled: boolean): Object {
    return {
        type: SET_TOOLBOX_ENABLED,
        enabled
    };
}

/**
 * Dispatches an action which sets new timeout and clears the previous one.
 *
 * @param {Function} handler - Function to be invoked after the timeout.
 * @param {number} timeoutMS - Delay.
 * @returns {{
 *     type: SET_TOOLBOX_TIMEOUT,
 *     handler: Function,
 *     timeoutMS: number
 * }}
 */
export function setToolboxTimeout(handler: Function, timeoutMS: number)
      : Object {
    return {
        type: SET_TOOLBOX_TIMEOUT,
        handler,
        timeoutMS
    };
}

/* eslint-enable flowtype/space-before-type-colon */

/**
 * Dispatches an action which sets new toolbox timeout value.
 *
 * @param {number} timeoutMS - Delay.
 * @returns {{
 *     type: SET_TOOLBOX_TIMEOUT_MS,
 *     timeoutMS: number
 * }}
 */
export function setToolboxTimeoutMS(timeoutMS: number): Object {
    return {
        type: SET_TOOLBOX_TIMEOUT_MS,
        timeoutMS
    };
}

/**
 * Shows/hides the toolbox.
 *
 * @param {boolean} visible - True to show the toolbox or false to hide it.
 * @returns {{
 *     type: SET_TOOLBOX_VISIBLE,
 *     visible: boolean
 * }}
 */
export function setToolboxVisible(visible: boolean): Object {
    return {
        type: SET_TOOLBOX_VISIBLE,
        visible
    };
}

/**
 * Shows etherpad button if it's not shown.
 *
 * @returns {Function}
 */
export function showEtherpadButton(): Function {
    return (dispatch: Dispatch<*>) => {
        dispatch(setToolbarButton('etherpad', {
            hidden: false
        }));
    };
}

/**
 * Event handler for full screen toggled event.
 *
 * @param {boolean} isFullScreen - Flag showing whether app in full
 * screen mode.
 * @returns {Function}
 */
export function toggleFullScreen(isFullScreen: boolean): Function {
    return (dispatch: Dispatch<*>, getState: Function) => {
        const buttonName = 'fullscreen';
        const button = getButton(buttonName, getState());

        button.toggled = isFullScreen;

        dispatch(setToolbarButton(buttonName, button));
    };
}

/**
 * Sets negation of button's toggle property.
 *
 * @param {string} buttonName - Button key.
 * @returns {Function}
 */
export function toggleToolbarButton(buttonName: string): Function {
    return (dispatch: Dispatch, getState: Function) => {
        const button = getButton(buttonName, getState());

        dispatch(setToolbarButton(buttonName, {
            toggled: !button.toggled
        }));
    };
}
