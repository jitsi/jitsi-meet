/* @flow */

import type { Dispatch } from 'redux-thunk';

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

/**
 * Event handler for local raise hand changed event.
 *
 * @param {boolean} handRaised - Flag showing whether hand is raised.
 * @returns {Function}
 */
export function changeLocalRaiseHand(handRaised: boolean): Function {
    return (dispatch: Dispatch<*>, getState: Function) => {
        const state = getState();
        const { secondaryToolbarButtons } = state['features/toolbar'];
        const buttonName = 'raisehand';
        const button = secondaryToolbarButtons.get(buttonName);

        button.toggled = handRaised;

        dispatch(setToolbarButton(buttonName, button));
    };
}

/**
 * Signals that toolbar timeout should be cleared.
 *
 * @returns {{
 *      type: CLEAR_TOOLBAR_TIMEOUT
 * }}
 */
export function clearToolbarTimeout(): Object {
    return {
        type: CLEAR_TOOLBAR_TIMEOUT
    };
}

/**
 * Signals that always visible toolbars value should be changed.
 *
 * @param {boolean} alwaysVisible - Value to be set in redux store.
 * @returns {{
 *     type: SET_ALWAYS_VISIBLE_TOOLBAR,
 *     alwaysVisible: bool
 * }}
 */
export function setAlwaysVisibleToolbar(alwaysVisible: boolean): Object {
    return {
        type: SET_ALWAYS_VISIBLE_TOOLBAR,
        alwaysVisible
    };
}

/**
 * Enables / disables audio toolbar button.
 *
 * @param {boolean} enabled - Indicates if the button should be enabled
 * or disabled.
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
 *  Signals that value of conference subject should be changed.
 *
 *  @param {string} subject - Conference subject string.
 *  @returns {Object}
 */
export function setSubject(subject: string) {
    return {
        type: SET_SUBJECT,
        subject
    };
}

/**
 * Signals that toolbar subject slide in value should be changed.
 *
 * @param {boolean} subjectSlideIn - Flag showing whether subject is shown.
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
 *     buttonName: string,
 *     button: Object
 * }}
 */
export function setToolbarButton(buttonName: string, button: Object): Object {
    return {
        type: SET_TOOLBAR_BUTTON,
        buttonName,
        button
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
 * Dispatches an action which sets new timeout and clears the previous one.
 *
 * @param {Function} handler - Function to be invoked after the timeout.
 * @param {number} toolbarTimeout - Delay.
 * @returns {{
 *      type: SET_TOOLBAR_TIMEOUT,
 *      handler: Function,
 *      toolbarTimeout: number
 * }}
 */
export function setToolbarTimeout(handler: Function,
        toolbarTimeout: number): Object {
    return {
        type: SET_TOOLBAR_TIMEOUT,
        handler,
        toolbarTimeout
    };
}

/**
 * Dispatches an action which sets new toolbar timeout value.
 *
 * @param {number} toolbarTimeout - Delay.
 * @returns {{
 *      type: SET_TOOLBAR_TIMEOUT_NUMBER,
 *      toolbarTimeout: number
 * }}
 */
export function setToolbarTimeoutNumber(toolbarTimeout: number): Object {
    return {
        type: SET_TOOLBAR_TIMEOUT_NUMBER,
        toolbarTimeout
    };
}

/**
 * Shows/hides the toolbar.
 *
 * @param {boolean} visible - True to show the toolbar or false to hide it.
 * @returns {{
 *     type: SET_TOOLBAR_VISIBLE,
 *     visible: boolean
 * }}
 */
export function setToolbarVisible(visible: boolean): Object {
    return {
        type: SET_TOOLBAR_VISIBLE,
        visible
    };
}

/**
 * Enables / disables audio toolbar button.
 *
 * @param {boolean} enabled - Indicates if the button should be enabled
 * or disabled.
 * @returns {Function}
 */
export function setVideoIconEnabled(enabled: boolean = false): Function {
    return (dispatch: Dispatch<*>) => {
        const i18nKey = enabled ? 'videomute' : 'cameraDisabled';
        const i18n = `[content]toolbar.${i18nKey}`;
        const button = {
            enabled,
            i18n,
            toggled: !enabled
        };

        dispatch(setToolbarButton('camera', button));
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
        const state = getState();
        const { primaryToolbarButtons } = state['features/toolbar'];
        const buttonName = 'fullscreen';
        const button = primaryToolbarButtons.get(buttonName);

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
        const state = getState();
        const {
            primaryToolbarButtons,
            secondaryToolbarButtons
        } = state['features/toolbar'];
        const button
            = primaryToolbarButtons.get(buttonName)
                || secondaryToolbarButtons.get(buttonName);

        dispatch(setToolbarButton(buttonName, {
            toggled: !button.toggled
        }));
    };
}
