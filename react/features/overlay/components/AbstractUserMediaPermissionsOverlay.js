import PropTypes from 'prop-types';
import { Component } from 'react';

/**
 * Implements a React {@link Component} for overlay with guidance how to proceed
 * with gUM prompt.
 */
export default class AbstractUserMediaPermissionsOverlay extends Component {
    /**
     * {@code AbstractUserMediaPermissionsOverlay} component's property types.
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
     * Determines whether this overlay needs to be rendered (according to a
     * specific redux state). Called by {@link OverlayContainer}.
     *
     * @param {Object} state - The redux state.
     * @returns {boolean} - If this overlay needs to be rendered, {@code true};
     * {@code false}, otherwise.
     */
    static needsRender(state) {
        return state['features/overlay'].isMediaPermissionPromptVisible;
    }
}

/**
 * Maps (parts of) the redux state to the associated component's props.
 *
 * @param {Object} state - The redux state.
 * @protected
 * @returns {{
 *     browser: string
 * }}
 */
export function abstractMapStateToProps(state) {
    const { browser } = state['features/overlay'];

    return {
        browser
    };
}
