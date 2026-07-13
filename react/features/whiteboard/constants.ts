/**
 * Fixed name of the whiteboard fake participant.
 */
export const WHITEBOARD_PARTICIPANT_NAME = 'Whiteboard';

/**
 * Whiteboard ID.
 */
export const WHITEBOARD_ID = 'whiteboard';

/**
 * Whiteboard UI Options.
 */
export const WHITEBOARD_UI_OPTIONS = {
    canvasActions: {
        allowedShapes: [
            'arrow', 'diamond', 'ellipse', 'freedraw', 'line', 'rectangle', 'selection', 'text', 'eraser'
        ],
        allowedShortcuts: [
            'cut', 'deleteSelectedElements', 'redo', 'selectAll', 'undo'
        ],
        disableAlignItems: true,
        disableFileDrop: true,
        disableGrouping: true,
        disableHints: true,
        disableLink: true,
        disableShortcuts: true,
        disableVerticalAlignOptions: true,
        fontSizeOptions: [ 's', 'm', 'l' ],
        hideArrowHeadsOptions: true,
        hideColorInput: true,
        hideClearCanvas: true,
        hideFontFamily: true,
        hideHelpDialog: true,
        hideIOActions: true,
        hideLaserOnCollaboration: true,
        hideLayers: true,
        hideLibraries: true,
        hideLockButton: true,
        hideOpacityInput: true,
        hideEmbedableTools: true,
        hideSharpness: true,
        hideStrokeStyle: true,
        hideTextAlign: true,
        hideThemeControls: true,
        hideUserList: true,
        hideWelcomeScreen: true,
        saveAsImageOptions: {
            defaultBackgroundValue: true,
            disableScale: true,
            disableSelection: true,
            disableClipboard: true,
            disableSceneEmbed: true,
            hideTheme: true
        }
    }
};

/**
 * Whiteboard UI Options with image support enabled.
 *
 * Used only for the inline web whiteboard, where a storage backend and a token
 * provider are available to persist and sync image binaries. The standalone
 * whiteboard page (mobile/native) keeps {@link WHITEBOARD_UI_OPTIONS}, since it
 * has no conference context to supply storage credentials.
 */
export const WHITEBOARD_UI_OPTIONS_WITH_IMAGES = {
    ...WHITEBOARD_UI_OPTIONS,
    canvasActions: {
        ...WHITEBOARD_UI_OPTIONS.canvasActions,
        allowedShapes: [ ...WHITEBOARD_UI_OPTIONS.canvasActions.allowedShapes, 'image' ],
        disableFileDrop: false
    }
};

/**
 * Whiteboard default lower limit.
 */
export const MIN_USER_LIMIT = 10;

/**
 * Whiteboard soft limit diff.
 */
export const USER_LIMIT_THRESHOLD = 5;

/**
 * The pathName for the whiteboard page.
 *
 * @type {string}
 */
export const WHITEBOARD_PATH_NAME = 'static/whiteboard.html';
