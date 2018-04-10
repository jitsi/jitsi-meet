/**
 * Resolves with <tt>true</tt> if the deeplinking page should be shown and with
 * <tt>false</tt> otherwise.
 *
 * @returns {Promise<boolean>}
 */
export function _shouldShowDeeplinkingDesktopPage() {
    return Promise.resolve(false);
}
