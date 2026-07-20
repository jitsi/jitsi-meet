import { IReduxState } from '../app/types';
import { getRoomName } from '../base/conference/functions';

/**
 * Returns the code-editor config block from `config.js` (may be undefined).
 *
 * @param {IReduxState} state - The redux state.
 * @returns {Object|undefined}
 */
export function getCodeEditorConfig(state: IReduxState) {
    return state['features/base/config'].codeEditor;
}

/**
 * Whether the code editor feature is enabled for this deployment. It's a
 * NextRound fork feature, so it's on by default and can be turned off by setting
 * `config.codeEditor.enabled = false`.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isCodeEditorEnabled(state: IReduxState): boolean {
    return getCodeEditorConfig(state)?.enabled !== false;
}

/**
 * Whether the code editor overlay is currently open.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isCodeEditorOpen(state: IReduxState): boolean {
    return state['features/code-editor'].isOpen;
}

/**
 * Whether the toolbar button should be shown.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isCodeEditorButtonVisible(state: IReduxState): boolean {
    return isCodeEditorEnabled(state);
}

/**
 * The Yjs collaboration room. Both participants are in the same conference, so
 * the conference room name is a stable shared id — no exchange needed.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {string}
 */
export function getCollabRoom(state: IReduxState): string {
    return `code-${getRoomName(state) || 'default'}`;
}

/**
 * The WebSocket base URL of the code-collab relay. Falls back to the same origin
 * as the meeting frontend (nginx proxies `/code-collab`), so no extra config is
 * needed in production; dev can override via `config.codeEditor.collabServerBaseUrl`.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {string}
 */
export function getCollabServerUrl(state: IReduxState): string {
    const configured = getCodeEditorConfig(state)?.collabServerBaseUrl;

    if (configured) {
        return configured;
    }

    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';

    return `${proto}://${window.location.host}/code-collab`;
}
