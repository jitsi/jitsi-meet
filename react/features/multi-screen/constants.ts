/**
 * The default window id used when the embedder does not specify one.
 */
export const DEFAULT_SECOND_SCREEN_ID = 'default';

/**
 * The id prefix of the second-screen windows opened from the in-app triggers,
 * as opposed to the ones an embedder opens through the external API. The
 * in-app triggers only ever take over a window of their own (see
 * {@code pickSecondScreenTarget}), so an embedder's windows keep showing what
 * the embedder put on them.
 */
export const UI_SECOND_SCREEN_ID_PREFIX = 'ui-screen-';
