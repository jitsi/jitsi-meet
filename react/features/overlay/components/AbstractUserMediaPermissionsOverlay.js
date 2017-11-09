import PropTypes from 'prop-types';
import { Component } from 'react';


/**
 * Implements a React Component for overlay with guidance how to proceed with
 * gUM prompt.
 */
export default class AbstractUserMediaPermissionsOverlay extends Component {
    /**
     * UserMediaPermissionsOverlay component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The browser which is used currently. The text is different for every
         * browser.
         *
         * @public
         * @type {string}
         */
        browser: PropTypes.string,

        /**
         * The function to translate human-readable text.
         *
         * @public
         * @type {Function}
         */
        t: PropTypes.func
    };

    /**
     * Check if this overlay needs to be rendered. This function will be called
     * by the {@code OverlayContainer}.
     *
     * @param {Object} state - The redux state.
     * @returns {boolean} - True if this overlay needs to be rendered, false
     * otherwise.
     */
    static needsRender(state) {
        return state['features/overlay'].isMediaPermissionPromptVisible;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement|null}
     */
    render() {
        return null;
    }
}

/**
 * Maps (parts of) the redux state to the associated component's props.
 *
 * @param {Object} state - The redux state.
 * @returns {{
 *      browser: string
 * }}
 * @protected
 */
export function abstractMapStateToProps(state) {
    const { browser } = state['features/overlay'];

    return {
        browser
    };
}
