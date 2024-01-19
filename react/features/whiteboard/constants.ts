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
            'arrow', 'diamond', 'ellipse', 'freedraw', 'line', 'rectangle', 'selection', 'text'
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
        hideLayers: true,
        hideLibraries: true,
        hideLockButton: true,
        hideOpacityInput: true,
        hideSharpness: true,
        hideStrokeStyle: true,
        hideTextAlign: true,
        hideThemeControls: true,
        hideUserList: true,
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
 * Whiteboard default lower limit.
 */
export const MIN_USER_LIMIT = 10;

/**
 * Whiteboard soft limit diff.
 */
export const USER_LIMIT_THRESHOLD = 5;
