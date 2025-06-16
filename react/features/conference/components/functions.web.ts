export * from './functions.any';

/**
 * Whether or not there are always on labels.
 *
 * @returns {boolean}
 */
export function isAlwaysOnTitleBarEmpty() {
    const bar = document.querySelector('#alwaysVisible>div');

    return bar?.childNodes.length === 0;
}
