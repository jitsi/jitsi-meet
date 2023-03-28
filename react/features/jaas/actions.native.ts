/**
 * Shows a dialog prompting users to upgrade, if requested feature is disabled.
 *
 * @param {string} _feature - Used on web.
 * @returns {Function}
 */
export function maybeShowPremiumFeatureDialog(_feature: string) {
    return function() {
        return false;
    };
}
