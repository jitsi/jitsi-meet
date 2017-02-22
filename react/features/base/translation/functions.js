import { translate as reactTranslate } from 'react-i18next';

/**
 * Wrap a translatable component.
 *
 * @param {Component} component - the component to wrap
 * @returns {Component} the wrapped component.
 */
export function translate(component) {
    // use the default list of namespaces
    return reactTranslate([ 'main', 'languages' ], { wait: true })(component);
}
