/* @flow */

import ReactDOM from 'react-dom';

type functionToElement = () => ReactElement<*>;

/**
 * Provides a minimal equivalent of react-native's AppRegistry abstraction.
 */
export default {
    /**
     * Equivalent of react-native's registerComponent. For web app it renders
     * component into the web page.
     *
     * @param {string} name - Name of the component. Web version doesn't
     * use it.
     * @param {Function} funcToElement - Function that returns React element.
     * @returns {void}
     */
    registerComponent(name: String, funcToElement: functionToElement) {
        ReactDOM.render(funcToElement(),
            document.getElementById('react'));
    }
};
