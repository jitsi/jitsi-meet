/**
 * The type of the action which clears the Toolbox visibility timeout.
 *
 * {
 *     type: CLEAR_TOOLBOX_TIMEOUT
 * }
 */
export const CLEAR_TOOLBOX_TIMEOUT = Symbol('CLEAR_TOOLBOX_TIMEOUT');

/**
 * The type of (redux) action which updates whether the conference is or is not
 * currently in full screen view.
 *
 * {
 *     type: FULL_SCREEN_CHANGED,
 *     fullScreen: boolean
 * }
 */
export const FULL_SCREEN_CHANGED = Symbol('FULL_SCREEN_CHANGED');

/**
 * The type of the action which sets the default toolbar buttons of the Toolbox.
 *
 * {
 *     type: SET_DEFAULT_TOOLBOX_BUTTONS,
 *     primaryToolbarButtons: Map,
 *     secondaryToolbarButtons: Map
 * }
 */
export const SET_DEFAULT_TOOLBOX_BUTTONS
    = Symbol('SET_DEFAULT_TOOLBOX_BUTTONS');

/**
 * The type of (redux) action which requests full screen mode be entered or
 * exited.
 *
 * {
 *     type: SET_FULL_SCREEN,
 *     fullScreen: boolean
 * }
 */
export const SET_FULL_SCREEN = Symbol('SET_FULL_SCREEN');

/**
 * The type of the action which sets the conference subject.
 *
 * {
 *     type: SET_SUBJECT,
 *     subject: string
 * }
 */
export const SET_SUBJECT = Symbol('SET_SUBJECT');

/**
 * The type of the action which sets the subject slide in.
 *
 * {
 *     type: SET_SUBJECT_SLIDE_IN,
 *     subjectSlideIn: boolean
 * }
 */
export const SET_SUBJECT_SLIDE_IN = Symbol('SET_SUBJECT_SLIDE_IN');

/**
 * The type of the action which sets the indicator which determiens whether a
 * fToolbar in the Toolbox is hovered.
 *
 * {
 *     type: SET_TOOLBAR_HOVERED,
 *     hovered: boolean
 * }
 */
export const SET_TOOLBAR_HOVERED = Symbol('SET_TOOLBAR_HOVERED');

/**
 * The type of the action which sets the permanent visibility of the Toolbox.
 *
 * {
 *     type: SET_TOOLBOX_ALWAYS_VISIBLE,
 *     alwaysVisible: boolean
 * }
 */
export const SET_TOOLBOX_ALWAYS_VISIBLE = Symbol('SET_TOOLBOX_ALWAYS_VISIBLE');

/**
 * The type of the (redux) action which enables/disables the Toolbox.
 *
 * {
 *     type: SET_TOOLBOX_ENABLED,
 *     enabled: boolean
 * }
 */
export const SET_TOOLBOX_ENABLED = Symbol('SET_TOOLBOX_ENABLED');

/**
 * The type of the action which sets a new Toolbox visibility timeout and its
 * delay.
 *
 * {
 *     type: SET_TOOLBOX_TIMEOUT,
 *     handler: Function,
 *     timeoutMS: number
 * }
 */
export const SET_TOOLBOX_TIMEOUT = Symbol('SET_TOOLBOX_TIMEOUT');

/**
 * The type of the action which sets the delay in milliseconds after which
 * the Toolbox visibility is to be changed.
 *
 * {
 *     type: SET_TOOLBOX_TIMEOUT_MS,
 *     timeoutMS: number
 * }
 */
export const SET_TOOLBOX_TIMEOUT_MS = Symbol('SET_TOOLBOX_TIMEOUT');

/**
 * The type of the (redux) action which shows/hides the Toolbox.
 *
 * {
 *     type: SET_TOOLBOX_VISIBLE,
 *     visible: boolean
 * }
 */
export const SET_TOOLBOX_VISIBLE = Symbol('SET_TOOLBOX_VISIBLE');
