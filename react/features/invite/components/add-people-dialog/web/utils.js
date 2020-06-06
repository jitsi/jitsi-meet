// @flow

/**
 * Tries to copy a given text to the clipboard.
 *
 * @param {string} textToCopy - Text to be copied.
 * @returns {boolean}
 */
export function copyText(textToCopy: string) {
    const fakeTextArea = document.createElement('textarea');

    // $FlowFixMe
    document.body.appendChild(fakeTextArea);
    fakeTextArea.value = textToCopy;
    fakeTextArea.select();

    const result = document.execCommand('copy');

    // $FlowFixMe
    document.body.removeChild(fakeTextArea);

    return result;
}
