/**
 * Returns the location of the sounds. On Android sounds files are copied to
 * the 'assets/sounds/' folder of the SDK bundle on build time.
 *
 * @returns {string}
 */
export function getSoundsPath() {
    return 'asset:/sounds';
}
