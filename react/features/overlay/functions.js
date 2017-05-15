/* global APP */
/**
 * Reloads the page.
 *
 * @returns {void}
 * @protected
 */
export function reconnectNow() {
    // FIXME: In future we should dispatch an action here that will result
    // in reload.
    APP.ConferenceUrl.reload();
}
