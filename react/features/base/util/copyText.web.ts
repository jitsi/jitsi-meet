import clipboardCopy from 'clipboard-copy';

/**
 * Tries to copy a given text to the clipboard.
 * Returns true if the action succeeds.
 *
 * @param {string} textToCopy - Text to be copied.
 * @returns {Promise<boolean>}
 */
export async function copyText(textToCopy: string) {
    try {
        await clipboardCopy(textToCopy);

        return true;
    } catch (e) {
        return false;
    }
}
