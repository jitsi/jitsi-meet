import { Symbol } from '../base/react';

/**
 * The type of the action which signals that toolbar timeout should be changed.
 *
 * {
 *      type: CLEAR_TOOLBAR_TIMEOUT
 * }
 */
export const CLEAR_TOOLBAR_TIMEOUT = Symbol('CLEAR_TOOLBAR_TIMEOUT');

/**
 * The type of the action which signals that a value for always visible toolbar
 * should be changed.
 *
 * {
 *     type: SET_ALWAYS_VISIBLE_TOOLBAR,
 *     alwaysVisible: boolean
 * }
 */
export const SET_ALWAYS_VISIBLE_TOOLBAR = Symbol('SET_ALWAYS_VISIBLE_TOOLBAR');

/**
 * The type of the action which signals that a value for conference subject
 * should be changed.
 *
 * {
 *      type: SET_SUBJECT,
 *      subject: string
 * }
 */
export const SET_SUBJECT = Symbol('SET_SUBJECT');

/**
 * The type of the action which signals that a value of subject slide in should
 * be changed.
 *
 * {
 *     type: SET_SUBJECT_SLIDE_IN,
 *     subjectSlideIn: boolean
 * }
 */
export const SET_SUBJECT_SLIDE_IN = Symbol('SET_SUBJECT_SLIDE_IN');

/**
 * The type of the action which signals that a value for toolbar button should
 * be changed.
 *
 * {
 *     type: SET_TOOLBAR_BUTTON,
 *     button: Object,
 *     key: string
 * }
 */
export const SET_TOOLBAR_BUTTON = Symbol('SET_TOOLBAR_BUTTON');

/**
 * The type of the action which signals that toolbar is/isn't being hovered.
 *
 * {
 *     type: SET_TOOLBAR_HOVERED,
 *     hovered: boolean
 * }
 */
export const SET_TOOLBAR_HOVERED = Symbol('SET_TOOLBAR_HOVERED');

/**
 * The type of the action which signals that new toolbar timeout should be set
 * and the value of toolbar timeout should be changed.
 *
 * {
 *      type: SET_TOOLBAR_TIMEOUT,
 *      handler: Function,
        toolbarTimeout: number
 * }
 */
export const SET_TOOLBAR_TIMEOUT = Symbol('SET_TOOLBAR_TIMEOUT');

/**
 * The type of the action which signals that value of toolbar timeout should
 * be changed.
 *
 * {
 *      type: SET_TOOLBAR_TIMEOUT_NUMBER,
 *      toolbarTimeout: number
 * }
 */
export const SET_TOOLBAR_TIMEOUT_NUMBER = Symbol('SET_TOOLBAR_TIMEOUT');

/**
 * The type of the (redux) action which shows/hides the toolbar.
 *
 * {
 *     type: SET_TOOLBAR_VISIBLE,
 *     visible: boolean
 * }
 */
export const SET_TOOLBAR_VISIBLE = Symbol('SET_TOOLBAR_VISIBLE');
