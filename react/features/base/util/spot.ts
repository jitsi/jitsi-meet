
/**
 * Checks if Jitsi Meet is running on Spot TV.
 *
 * @returns {boolean} Whether or not Jitsi Meet is running on Spot TV.
 */
export function isSpotTV(): boolean {
    return navigator.userAgent.includes('SpotElectron/');
}
