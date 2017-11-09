import PropTypes from 'prop-types';
import { Component } from 'react';

/**
 * Implements a React Component for suspended overlay. Shown when a suspend is
 * detected.
 */
export default class AbstractSuspendedOverlay extends Component {
    /**
     * SuspendedOverlay component's property types.
     *
     * @static
     */
    static propTypes = {
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
        return state['features/overlay'].suspendDetected;
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
