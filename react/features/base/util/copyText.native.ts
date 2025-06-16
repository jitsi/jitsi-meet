import Clipboard from '@react-native-clipboard/clipboard';

/**
 * Tries to copy a given text to the clipboard.
 * Returns true if the action succeeds.
 *
 * @param {string} textToCopy - Text to be copied.
 * @returns {Promise<boolean>}
 */
export function copyText(textToCopy: string) {
    try {
        Clipboard.setString(textToCopy);

        return true;
    } catch (e) {
        return false;
    }
}
